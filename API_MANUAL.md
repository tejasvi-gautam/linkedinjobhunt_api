# LinkedIn Job Automation API Manual

Backend-only REST API for scraping public LinkedIn job listings, generating AI-powered cold emails, sending emails with a resume attachment, and logging application attempts locally.

## Tech Stack

- Node.js
- Express.js
- Playwright
- Gemini API
- Resend API
- dotenv

## Project Structure

```text
project/
├── server.js
├── .env
├── resume.pdf
├── package.json
├── routes/
├── controllers/
├── services/
├── utils/
└── logs/
    └── applications.json
```

## Setup

Install dependencies:

```bash
npm install
```

Start the API:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

Default base URL:

```text
http://127.0.0.1:3000
```

## Environment Variables

Create or update `.env` in the project root:

```env
PORT=3000
HOST=127.0.0.1
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=Your Name <onboarding@resend.dev>
```

### Required Files

Place your resume at:

```text
resume.pdf
```

The `/email/send` and `/automation/run` endpoints attach this file to outgoing emails.

## Standard Response Format

Successful responses use:

```json
{
  "success": true
}
```

Error responses use:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Endpoints

## 1. Health Check

```http
GET /health
```

Checks if the API is running.

### Response

```json
{
  "success": true,
  "message": "API running"
}
```

### cURL

```bash
curl http://127.0.0.1:3000/health
```

## 2. Scrape LinkedIn Jobs

```http
GET /jobs/scrape?keyword=backend+intern&limit=5
```

Scrapes public LinkedIn job cards using Playwright.

### Query Parameters

| Name | Required | Description |
| --- | --- | --- |
| `keyword` | Yes | Job search keyword. Example: `backend intern` |
| `limit` | No | Number of jobs to return. Default: `5`, max: `25` |

### Response

```json
{
  "success": true,
  "jobs": [
    {
      "title": "Backend Intern",
      "company": "Example Company",
      "url": "https://www.linkedin.com/jobs/view/example",
      "location": "Remote"
    }
  ]
}
```

### cURL

```bash
curl "http://127.0.0.1:3000/jobs/scrape?keyword=backend+intern&limit=5"
```

### Notes

LinkedIn may block, rate-limit, or change public page markup. If no public job cards are visible, the endpoint returns an empty jobs array.

## 3. Generate Cold Email

```http
POST /email/generate
```

Generates a concise professional cold email under 150 words using Gemini.

### Request Body

```json
{
  "jobTitle": "Backend Developer Intern",
  "company": "Example Company"
}
```

### Candidate Profile Used

- Robotics developer
- Backend developer
- ROS2 drone project
- Crypto trading bot
- Skills: Python, C++, Node.js

### Response

```json
{
  "success": true,
  "email": "Hello Example Company team..."
}
```

### cURL

```bash
curl -X POST http://127.0.0.1:3000/email/generate \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Backend Developer Intern",
    "company": "Example Company"
  }'
```

## 4. Send Email

```http
POST /email/send
```

Sends an HTML email using Resend and attaches the local `resume.pdf`.

### Request Body

```json
{
  "to": "careers@example.com",
  "subject": "Application for Backend Developer Intern",
  "body": "Hello Example Company team,\n\nI am interested in the Backend Developer Intern role..."
}
```

### Response

```json
{
  "success": true,
  "message": "Email sent",
  "data": {
    "id": "email_id_from_resend"
  }
}
```

### cURL

```bash
curl -X POST http://127.0.0.1:3000/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "careers@example.com",
    "subject": "Application for Backend Developer Intern",
    "body": "Hello Example Company team,\n\nI am interested in the role."
  }'
```

### Notes

Make sure:

- `RESEND_API_KEY` is configured.
- `RESEND_FROM_EMAIL` is verified or allowed by Resend.
- `resume.pdf` exists in the project root.

## 5. Run Full Automation

```http
POST /automation/run
```

Runs the full workflow:

1. Scrape LinkedIn jobs for a keyword.
2. Guess recruiter emails for each company.
3. Generate AI cold emails.
4. Send emails with `resume.pdf`.
5. Save application logs locally.

### Request Body

```json
{
  "keyword": "backend intern",
  "limit": 5
}
```

### Guessed Email Pattern

For each company, the API tries:

```text
careers@company.com
hr@company.com
```

Example:

```text
careers@examplecompany.com
hr@examplecompany.com
```

### Response

```json
{
  "success": true,
  "jobsFound": 5,
  "applicationsAttempted": 10,
  "results": [
    {
      "company": "Example Company",
      "jobTitle": "Backend Developer Intern",
      "email": "careers@examplecompany.com",
      "timestamp": "2026-05-27T13:30:00.000Z",
      "status": "sent"
    },
    {
      "company": "Example Company",
      "jobTitle": "Backend Developer Intern",
      "email": "hr@examplecompany.com",
      "timestamp": "2026-05-27T13:30:05.000Z",
      "status": "failed",
      "error": "Reason for failure"
    }
  ]
}
```

### cURL

```bash
curl -X POST http://127.0.0.1:3000/automation/run \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "backend intern",
    "limit": 5
  }'
```

### Failure Behavior

If one email fails, the automation continues with the next email. Each attempt is logged with either:

```text
sent
failed
```

## Application Logs

Logs are saved to:

```text
logs/applications.json
```

Log format:

```json
[
  {
    "company": "Example Company",
    "jobTitle": "Backend Developer Intern",
    "email": "careers@examplecompany.com",
    "timestamp": "2026-05-27T13:30:00.000Z",
    "status": "sent"
  }
]
```

## Common Errors

### Missing Gemini API Key

```json
{
  "success": false,
  "message": "GEMINI_API_KEY is not configured"
}
```

Fix: Add a valid `GEMINI_API_KEY` to `.env`.

### Missing Resend API Key

```json
{
  "success": false,
  "message": "RESEND_API_KEY is not configured"
}
```

Fix: Add a valid `RESEND_API_KEY` to `.env`.

### Missing Resume

```json
{
  "success": false,
  "message": "resume.pdf not found in project root"
}
```

Fix: Place `resume.pdf` in the project root.

### Missing Request Fields

```json
{
  "success": false,
  "message": "jobTitle and company are required"
}
```

Fix: Send all required JSON body fields for the endpoint.

## Production Notes

- Use a verified sending domain in Resend before emailing real recruiters.
- Avoid sending bulk unsolicited emails.
- Respect LinkedIn terms, robots rules, and applicable email laws.
- Add authentication before exposing this API publicly.
- Consider rate limiting `/automation/run`.
- Replace guessed emails with verified contacts when possible.
- Keep `.env`, API keys, and `logs/applications.json` out of source control.
