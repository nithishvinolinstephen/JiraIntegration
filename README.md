# User Story to Tests

A full-stack application that automatically generates comprehensive test cases from user stories using AI-powered analysis. Built with React, TypeScript, and Node.js, powered by Groq's LLM API.

## Features

- **AI-Powered Test Generation**: Automatically generate test cases from user stories using advanced language models
- **Comprehensive Test Coverage**: Generates positive, negative, edge case, authorization, and non-functional test cases
- **Test Data Generation**: Automatically creates relevant test data for each test case
- **Interactive UI**: Expandable test case details with step-by-step test execution guidance
- **Real-time Processing**: See results as they're generated
- **Token Usage Tracking**: Monitor API token usage for cost optimization

## Prerequisites

- Node.js >= 16.x
- npm or yarn package manager
- Groq API key (get one at [https://console.groq.com](https://console.groq.com))

## Project Structure

```
├── backend/                 # Express.js backend server
│   ├── src/
│   │   ├── server.ts       # Main server setup
│   │   ├── routes/         # API endpoints
│   │   ├── llm/            # LLM integration
│   │   ├── schemas.ts      # Zod validation schemas
│   │   └── prompt.ts       # System and user prompts
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx         # Main component
│   │   ├── api.ts          # API communication
│   │   ├── types.ts        # TypeScript interfaces
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── vite.config.ts
├── package.json            # Root package configuration
├── .env.example            # Environment variables template
└── README.md              # This file
```

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/nithishvinolinstephen/UserStoryToTestCase.git
cd UserStoryToTestCase
```

2. **Install dependencies**
```bash
npm install
```

This will install dependencies for both backend and frontend.

## Setup

### 1. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
PORT=8080
CORS_ORIGIN=http://localhost:5173
groq_API_BASE=https://api.groq.com/openai/v1
groq_API_KEY=your_groq_api_key_here
groq_MODEL=openai/gpt-oss-120b
```

**Important**: Never commit the `.env` file. It's already in `.gitignore`.

### 2. Get Your Groq API Key

1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Create an API key
4. Add it to your `.env` file

## Running the Application

### Development Mode

Open two terminals:

**Terminal 1 - Backend (runs on port 8080):**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend (runs on port 5173):**
```bash
npm run dev:frontend
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Usage

1. **Enter User Story Details**
   - **Story Title**: Brief title of the user story
   - **Description**: Detailed description (optional)
   - **Acceptance Criteria**: Specific criteria the story must meet
   - **Additional Info**: Any other relevant information (optional)

2. **Generate Test Cases**
   - Click the "Generate" button
   - Wait for the AI to analyze and generate test cases

3. **View Results**
   - Test cases are displayed in a table with:
     - Test Case ID
     - Title
     - Category (Positive, Negative, Edge, Authorization, Non-Functional)
     - Test Data
     - Expected Result

4. **Expand Details**
   - Click on a Test Case ID to expand and view:
     - Step-by-step test execution
     - Test data for each step
     - Expected results

## API Endpoints

### POST `/api/generate`

Generates test cases from a user story.

**Request Body:**
```json
{
  "storyTitle": "User login functionality",
  "acceptanceCriteria": "User should be able to login with valid credentials",
  "description": "As a user, I want to login to the application",
  "additionalInfo": "Email or username can be used for login"
}
```

**Response:**
```json
{
  "cases": [
    {
      "id": "TC-001",
      "title": "Valid login with email",
      "steps": ["Navigate to login page", "Enter valid email", "Enter valid password", "Click login"],
      "testData": "email: test@example.com, password: Test123!",
      "expectedResult": "User is logged in successfully",
      "category": "Positive"
    }
  ],
  "model": "gpt-oss-120b",
  "promptTokens": 1250,
  "completionTokens": 450
}
```

## Technology Stack

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Zod** - Schema validation
- **Groq API** - LLM integration
- **CORS** - Cross-origin support

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **CSS** - Styling

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `8080` |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:5173` |
| `groq_API_BASE` | Groq API base URL | `https://api.groq.com/openai/v1` |
| `groq_API_KEY` | Your Groq API key | `gsk_xxxxxxxxxxxx` |
| `groq_MODEL` | LLM model to use | `openai/gpt-oss-120b` |

## Available Models

You can use any Groq-supported model. Popular options:
- `openai/gpt-oss-120b` - More capable, slightly slower
- `mixtral-8x7b-32768` - Faster, good for most use cases
- `llama2-70b-4096` - Reliable and fast

## Troubleshooting

### API Key Error
- Verify your API key is valid at [https://console.groq.com](https://console.groq.com)
- Ensure `.env` file is in the root directory
- Restart the backend server after updating `.env`

### CORS Issues
- Check that `CORS_ORIGIN` matches your frontend URL
- Default is `http://localhost:5173` for Vite

### Port Already in Use
- Change `PORT` in `.env` to an available port
- Or kill the process using the port

## Performance Tips

- Test cases are generated in real-time via the LLM
- Shorter, more specific stories generate faster results
- Token usage is tracked for cost monitoring

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the maintainers.

## Disclaimer

This tool uses AI to generate test cases. While it provides a good starting point, human review and refinement of generated test cases is recommended for production use.
