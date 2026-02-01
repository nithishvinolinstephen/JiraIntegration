import axios, { AxiosInstance } from 'axios'

export interface JiraStory {
  key: string
  title: string
  description: string
  acceptanceCriteria: string
}

export class JiraClient {
  private client: AxiosInstance
  private baseUrl: string
  private apiToken: string
  private email: string

  constructor() {
    this.baseUrl = (process.env.JIRA_BASE_URL || 'https://your-instance.atlassian.net').replace(/\/$/, '')
    this.apiToken = process.env.JIRA_API_TOKEN || ''
    this.email = process.env.JIRA_EMAIL || ''

    if (!this.apiToken || !this.email) {
      console.warn('JIRA credentials not configured. Set JIRA_API_TOKEN and JIRA_EMAIL environment variables.')
    }

    console.log(`🔗 JIRA Client initialized with URL: ${this.baseUrl}`)
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: this.email,
        password: this.apiToken
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
  }

  async testConnection(): Promise<any> {
    try {
      // Try to fetch first 5 issues to test connection using the new JQL search API
      // POST /rest/api/3/search/jql with JSON body is the recommended approach
      let response
      try {
        response = await this.client.post('/rest/api/3/search/jql', {
          jql: 'ORDER BY created DESC',
          maxResults: 5,
          fields: ['key', 'summary', 'status']
        })
      } catch (err) {
        // If v3 search/jql is not available, try the older v2 search endpoint as a fallback
        console.warn('POST /rest/api/3/search/jql failed, falling back to /rest/api/2/search', err instanceof Error ? err.message : err)
        response = await this.client.get('/rest/api/2/search', {
          params: {
            jql: 'ORDER BY created DESC',
            maxResults: 5,
            fields: 'key,summary,status'
          }
        })
      }

      const issues = response.data.issues || []
      
      return {
        status: 'connected',
        message: 'Successfully connected to JIRA',
        issuesFound: issues.length,
        recentIssues: issues.map((issue: any) => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status.name
        })),
        instruction: `Try fetching one of these issues: ${issues.map((i: any) => i.key).join(', ')}`
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`JIRA API Error - Status: ${error.response?.status}, URL: ${this.baseUrl}/rest/api/3/issues`)
        console.error(`Request URL: ${error.config?.url}`)
        console.error(`Error: ${error.message}`)
        
        if (error.response?.status === 404) {
          throw new Error(`JIRA API returned 404. Possible causes:\n1. JIRA_BASE_URL is incorrect: ${this.baseUrl}\n2. JIRA instance doesn't exist\n3. Network/proxy issues\n\nTry visiting this URL in browser: ${this.baseUrl}/rest/api/3/serverInfo`)
        }
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error('Authentication failed. Verify JIRA_EMAIL and JIRA_API_TOKEN are correct. Check https://id.atlassian.com/manage-profile/security/api-tokens')
        }
        throw new Error(`JIRA API error: ${error.response?.status} ${error.response?.statusText || error.message}`)
      }
      throw new Error(`Failed to connect to JIRA: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getStory(storyKey: string): Promise<JiraStory> {
    try {
      // Request names mapping so we can find custom field ids by human-readable name
      let response = await this.client.get(`/rest/api/3/issue/${storyKey}`, {
        params: { expand: 'names' }
      })

      // Fallback to v2 if v3 returns 410
      if (response && response.status === 410) {
        console.warn(`JIRA /rest/api/3/issue returned 410 for ${storyKey}, falling back to /rest/api/2/issue`)
        response = await this.client.get(`/rest/api/2/issue/${storyKey}`)
      }

      const issue = response.data

      // Extract story details from JIRA response
      const title = issue.fields.summary || ''
      const description = issue.fields.description?.content
        ?.map((block: any) => {
          if (block.type === 'paragraph') {
            return block.content?.map((c: any) => c.text).join('') || ''
          }
          if (block.type === 'heading') {
            return block.content?.map((c: any) => c.text).join('') || ''
          }
          if (block.type === 'bulletList' || block.type === 'orderedList') {
            return (block.content || []).map((list: any) =>
              (list.content || []).map((item: any) => item.content?.map((c: any) => c.text).join('')).join('\n')
            ).join('\n')
          }
          return ''
        })
        .join('\n') || ''
      
      // Extract acceptance criteria from custom field(s) or description
      let acceptanceCriteria = ''

      // Helper to convert field value to text (handles strings and simple ADF-like objects)
      const extractFieldText = (val: any): string => {
        if (!val) return ''
        if (typeof val === 'string') return val
        // If it's Atlassian Document Format
        if (val.content) {
          return (val.content || []).map((block: any) => {
            if (block.type === 'paragraph' || block.type === 'heading') {
              return (block.content || []).map((c: any) => c.text).join('')
            }
            if (block.type === 'bulletList' || block.type === 'orderedList') {
              return (block.content || []).map((list: any) =>
                (list.content || []).map((item: any) => item.content?.map((c: any) => c.text).join('')).join('\n')
              ).join('\n')
            }
            return ''
          }).join('\n')
        }
        // If it's an array of strings/objects
        if (Array.isArray(val)) return val.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join('\n')
        // Fallback stringify
        return String(val)
      }

      // 1) Known common custom field IDs to try first
      const commonCustomFields = ['customfield_10014', 'customfield_10015', 'customfield_10016']
      for (const cf of commonCustomFields) {
        if (!acceptanceCriteria && issue.fields && issue.fields[cf]) {
          acceptanceCriteria = extractFieldText(issue.fields[cf])
        }
      }

      // 2) If still empty, use the names mapping (expand=names) to find a field whose name contains 'acceptance'
      if (!acceptanceCriteria && response.data && response.data.names) {
        const namesMap = response.data.names as Record<string, string>
        const matchKey = Object.keys(namesMap).find(k => /acceptance\s*criteria/i.test(namesMap[k]))
        if (matchKey && issue.fields && issue.fields[matchKey]) {
          acceptanceCriteria = extractFieldText(issue.fields[matchKey])
        }
      }

      // 3) Fallback: parse description for common AC headings or markers
      if (!acceptanceCriteria && description) {
        // look for blocks after headings like 'Acceptance Criteria' or inline markers 'AC:'
        const acRegexes = [/(?:acceptance criteria)[:\s-]*([\s\S]*?)(?=\n\s*\n|$)/i, /\bAC\b[:\s-]*([\s\S]*?)(?=\n\s*\n|$)/i]
        for (const rx of acRegexes) {
          const m = description.match(rx)
          if (m && m[1]) {
            acceptanceCriteria = m[1].trim()
            break
          }
        }

        // If still not found, try to extract bullet list under a heading 'Acceptance Criteria'
        if (!acceptanceCriteria) {
          const lines = description.split(/\r?\n/)
          let inSection = false
          const collected: string[] = []
          for (const line of lines) {
            if (/^\s*acceptance criteria\s*[:\-]?\s*$/i.test(line)) { inSection = true; continue }
            if (inSection) {
              if (/^\s*$/.test(line)) break
              collected.push(line.trim())
            }
          }
          if (collected.length) acceptanceCriteria = collected.join('\n')
        }
      }

      return {
        key: issue.key,
        title,
        description,
        acceptanceCriteria
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Error fetching story ${storyKey}:`, error.message)
        
        if (error.response?.status === 404) {
          throw new Error(`JIRA story '${storyKey}' not found. Story may not exist or you may not have permission to view it.`)
        }
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error(`Authentication failed for story ${storyKey}. Verify credentials: JIRA_EMAIL and JIRA_API_TOKEN`)
        }
        throw new Error(`JIRA API error: ${error.response?.status} ${error.response?.statusText || error.message}`)
      }
      throw new Error(`Failed to fetch JIRA story: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
