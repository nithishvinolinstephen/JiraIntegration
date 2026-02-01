# JIRA Integration - User Story to Test Cases Generator

A full-stack web application that integrates with JIRA to fetch user stories and automatically generate comprehensive test cases using Groq LLM (Large Language Model).

## Features

✨ **Key Capabilities:**
- **JIRA Integration**: Fetch user stories directly from your JIRA instance by story ID
- **Auto-Fill Form**: Automatically populate story title, description, and acceptance criteria from JIRA
- **AI-Powered Test Generation**: Use Groq LLM to generate comprehensive test cases from user stories
- **Rich Test Details**: Each test case includes:
  - Test ID and title
  - Category classification (positive, negative, edge case, authorization, non-functional)
  - Step-by-step test procedures
  - Test data requirements
  - Expected results
- **Expandable UI**: Click any test case to view detailed steps and requirements

## Tech Stack

### Frontend
- **React** 18+ with TypeScript
- **Vite** - Fast build tool and dev server
- **Responsive CSS** - No external UI frameworks

### Backend
- **Node.js** with Express
- **TypeScript** - Type-safe backend code
- **Groq API** - LLM integration for test generation
- **Axios** - HTTP client for JIRA API calls
- **Zod** - Schema validation

### Integration
- **JIRA Cloud API** (v2 and v3) with automatic fallback
- **CORS** - Configured for local development

## Prerequisites

- **Node.js** 16+ and npm
- **JIRA Cloud Account** with API token
- **Groq API Key** (free tier available at [console.groq.com](https://console.groq.com))

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/nithishvinolinstephen/JiraIntegration.git
cd JiraIntegration
```

### 2. Configure Environment Variables

Create a `.env` file in the **project root** with the following:

```env
# JIRA Configuration
JIRA_BASE_URL=https://your-instance.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# Groq LLM Configuration
groq_API_KEY=your-groq-api-key
groq_API_BASE=https://api.groq.com/openai/v1
groq_MODEL=llama3-8b-8192

# Backend
PORT=8081
CORS_ORIGIN=http://localhost:5173,http://localhost:5174

# Environment
NODE_ENV=development
```

### 3. Get JIRA API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **Create API token**
3. Copy and paste into `.env` as `JIRA_API_TOKEN`

### 4. Get Groq API Key

1. Visit [Groq Console](https://console.groq.com)
2. Sign up (free) and create an API key
3. Copy and paste into `.env` as `groq_API_KEY`

### 5. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in another terminal/window)
cd frontend
npm install
```

## Running the Application

### Development Mode

**Terminal 1: Start Backend**
```bash
cd backend
npm run dev
# Backend runs on http://localhost:8081
```

**Terminal 2: Start Frontend**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5174
```

Then open [http://localhost:5174](http://localhost:5174) in your browser.

### Production Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Deploy the 'dist' folder to a static host
```

## Usage

### Workflow

1. **Enter JIRA Story ID** (e.g., `PROJ-123`)
   - Click **Enter** button to fetch story details from JIRA
   - Fields auto-populate: Story Title, Description, Acceptance Criteria

2. **Review/Edit Fields**
   - Adjust any auto-filled fields as needed
   - Add optional description or additional info

3. **Generate Test Cases**
   - Click **Generate** button
   - Groq LLM generates comprehensive test cases in seconds

4. **Explore Test Cases**
   - View test matrix with all test cases
   - Click test ID to expand and see detailed steps
   - Each step includes test data and expected results

### API Endpoints

#### JIRA Operations
- `POST /api/jira/fetch` - Fetch JIRA story details
  - Body: `{ "storyId": "PROJ-123" }`
  - Returns: `{ storyId, title, description, acceptanceCriteria }`

- `GET /api/jira/diagnose` - Check JIRA connection and environment

#### Test Generation
- `POST /api/generate-tests` - Generate test cases
  - Body: `{ storyTitle, acceptanceCriteria, description?, additionalInfo? }`
  - Returns: `{ cases: [{ id, title, steps[], testData?, expectedResult, category }], model, promptTokens?, completionTokens? }`

#### Utility
- `GET /api/health` - Server health check

## Configuration

### Temperature & Randomness

Control LLM response variability via environment variables:

```env
# Lower = more deterministic (0 = exact reproduction)
# Higher = more creative/random (1 = max variation)
GROQ_TEMPERATURE=0.2

# Nucleus sampling (0-1): lower = more focused
GROQ_TOP_P=0.95
```

**Recommended Settings:**
- **Reproducible tests**: `TEMPERATURE=0.1, TOP_P=0.9`
- **Balanced**: `TEMPERATURE=0.3, TOP_P=0.95` (default)
- **Creative**: `TEMPERATURE=0.7, TOP_P=1.0`

## Troubleshooting

### CORS Error
**Problem**: "CORS policy: Response to preflight request doesn't pass access control check"

**Solution**: Ensure `CORS_ORIGIN` in `.env` includes your frontend port (5173 or 5174).

### JIRA Story Not Found
**Problem**: "Failed to fetch JIRA story" error

**Steps**:
1. Verify JIRA story ID format (e.g., `TEST-1`, not `test-1`)
2. Run diagnostic endpoint: `GET http://localhost:8081/api/jira/diagnose`
3. Check `.env` credentials:
   - `JIRA_BASE_URL` should not have trailing slash
   - `JIRA_EMAIL` and `JIRA_API_TOKEN` must be valid
4. Ensure API token has read access to the JIRA project

### No Acceptance Criteria
**Problem**: Acceptance criteria field remains empty after JIRA fetch

**Solution**: Check if JIRA instance uses custom field for acceptance criteria; update `backend/src/llm/jiraClient.ts` field mapping if needed.

### LLM Response Invalid Schema
**Problem**: "LLM response does not match expected schema"

**Solution**: 
- Lower `GROQ_TEMPERATURE` for more consistent output
- Check system prompt in `backend/src/prompt.ts`
- Verify `groq_API_KEY` is valid

## Project Structure

```
JiraIntegration/
├── frontend/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx             # Main UI component
│   │   ├── api.ts              # API client functions
│   │   ├── types.ts            # TypeScript interfaces
│   │   └── main.tsx            # App entry point
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                     # Node.js + Express backend
│   ├── src/
│   │   ├── server.ts           # Express app & CORS setup
│   │   ├── schemas.ts          # Zod validation schemas
│   │   ├── prompt.ts           # LLM system & user prompts
│   │   ├── llm/
│   │   │   ├── groqClient.ts   # Groq LLM integration
│   │   │   └── jiraClient.ts   # JIRA API client
│   │   └── routes/
│   │       ├── generate.ts     # Test generation route
│   │       └── jira.ts         # JIRA integration routes
│   ├── tsconfig.json
│   ├── package.json
│   └── build output (dist/)
│
├── .env                         # Environment variables (not in git)
├── package.json                 # Root package.json
└── README.md                    # This file
```

## Testing with Postman

A Postman collection is included for API testing:
- **File**: `Postman_Collection.json`
- **Import** into Postman and adjust base URL if needed

**Key Endpoints to Test:**
1. `GET /api/health` - Verify backend is running
2. `GET /api/jira/diagnose` - Check JIRA connection
3. `POST /api/jira/fetch` - Fetch a JIRA story
4. `POST /api/generate-tests` - Generate test cases

## Performance Notes

- **JIRA Fetch**: 1-3 seconds (depends on JIRA instance latency)
- **Test Generation**: 5-15 seconds (depends on Groq API load)
- **Frontend**: Instant, responsive UI with no external dependencies

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review backend logs: `npm run dev` in backend directory
- Open a GitHub Issue with error logs and environment details

---

**Built with ❤️ for test automation teams**
