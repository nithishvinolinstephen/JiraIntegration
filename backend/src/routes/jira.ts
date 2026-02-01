import express from 'express'
import { JiraClient } from '../llm/jiraClient'
import { z } from 'zod'

export const jiraRouter = express.Router()

// Validation schema for JIRA story fetch
const FetchJiraRequestSchema = z.object({
  storyId: z.string().min(1, 'Story ID is required').regex(/^[A-Z]+-\d+$/, 'Invalid JIRA story format. Expected format: PROJ-123')
})

const FetchJiraResponseSchema = z.object({
  storyId: z.string(),
  title: z.string(),
  description: z.string(),
  acceptanceCriteria: z.string()
})

export type FetchJiraResponse = z.infer<typeof FetchJiraResponseSchema>

// Diagnostic endpoint to check JIRA connection and list issues
jiraRouter.get('/diagnose', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const jiraClient = new JiraClient()
    
    // Check environment variables
    const hasCredentials = !!(process.env.JIRA_API_TOKEN && process.env.JIRA_EMAIL)
    
    const diagnostics = {
      status: 'checking',
      environment: {
        JIRA_BASE_URL: process.env.JIRA_BASE_URL || 'NOT SET',
        JIRA_EMAIL: process.env.JIRA_EMAIL ? '✓ SET' : '✗ NOT SET',
        JIRA_API_TOKEN: process.env.JIRA_API_TOKEN ? '✓ SET' : '✗ NOT SET',
        hasCredentials: hasCredentials
      },
      message: 'Attempting to fetch recent JIRA issues...'
    }
    
    if (!hasCredentials) {
      res.status(400).json({
        ...diagnostics,
        status: 'failed',
        error: 'JIRA credentials not configured in .env file',
        requiredEnvVars: ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN']
      })
      return
    }

    try {
      // Try a test API call to verify credentials
      const testStory = await jiraClient.testConnection()
      
      res.json({
        ...diagnostics,
        status: 'success',
        message: 'JIRA connection successful',
        connection: testStory
      })
    } catch (error) {
      res.status(400).json({
        ...diagnostics,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to connect to JIRA',
        troubleshooting: [
          '1. Verify JIRA_BASE_URL is correct (no trailing slash)',
          '2. Verify JIRA_EMAIL matches your JIRA account',
          '3. Verify JIRA_API_TOKEN is valid (check https://id.atlassian.com/manage-profile/security/api-tokens)',
          '4. Make sure you have permission to access issues in JIRA',
          '5. Try fetching a different story key'
        ]
      })
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

jiraRouter.post('/fetch', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    // Validate request body
    const validationResult = FetchJiraRequestSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      res.status(400).json({
        error: `Validation error: ${validationResult.error.message}`
      })
      return
    }

    const { storyId } = validationResult.data

    // Create JIRA client instance
    const jiraClient = new JiraClient()

    try {
      // Fetch story details from JIRA
      const story = await jiraClient.getStory(storyId)

      // Validate response schema
      const responseValidation = FetchJiraResponseSchema.safeParse({
        storyId: story.key,
        title: story.title,
        description: story.description,
        acceptanceCriteria: story.acceptanceCriteria
      })

      if (!responseValidation.success) {
        res.status(502).json({
          error: 'JIRA response does not match expected schema'
        })
        return
      }

      res.json(responseValidation.data)
    } catch (jiraError) {
      console.error('JIRA API error:', jiraError)
      const errorMessage = jiraError instanceof Error ? jiraError.message : 'Failed to fetch JIRA story'
      res.status(400).json({
        error: errorMessage
      })
      return
    }
  } catch (error) {
    console.error('Error in JIRA fetch route:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})
