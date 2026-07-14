# PRISM – Backend API Design

> **Version:** v1.0
> **Status:** Design Phase
> **Purpose:** Define the backend architecture, REST API endpoints, request/response formats, authentication flow, validation rules, and review lifecycle before implementation.

---

# Overview

The backend is responsible for:

- Authenticating users with GitHub OAuth
- Managing user sessions
- Fetching repositories from GitHub
- Fetching Pull Requests
- Starting AI reviews
- Communicating with the OpenAI API
- Storing review history
- Returning review results
- Protecting user data

The frontend **never communicates directly** with GitHub or OpenAI.

All requests pass through the backend.

```text
Frontend
    │
    ▼
PRISM Backend
    │
 ┌──┴──────────────┐
 ▼                 ▼
GitHub API     OpenAI API
```

---

# Backend Responsibilities

The backend acts as the central controller of the application.

Its responsibilities include:

- User authentication
- Session management
- Calling GitHub APIs
- Filtering unnecessary files
- Preparing prompts
- Calling the AI model
- Saving review history
- Returning responses to the frontend

---

# API Design Principles

The API follows REST principles.

General conventions:

- Use nouns instead of verbs.
- Use HTTP methods correctly.
- Always validate incoming requests.
- Never expose GitHub Access Tokens to the frontend.
- Return consistent JSON responses.

Example Success Response

```json
{
  "success": true,
  "message": "Repositories fetched successfully",
  "data": []
}
```

Example Error Response

```json
{
  "success": false,
  "message": "Repository not found"
}
```

---

# Authentication Flow

PRISM uses **GitHub OAuth** for authentication.

The backend manages the complete OAuth flow.

```text
User clicks Connect GitHub
            │
            ▼
Backend generates state
            │
            ▼
Backend redirects to GitHub
(client_id + state)
            │
            ▼
User grants permission
            │
            ▼
GitHub redirects back
(code + state)
            │
            ▼
Backend verifies state
            │
            ▼
Backend sends code + client_secret to GitHub
            │
            ▼
GitHub returns Access Token
            │
            ▼
Backend fetches GitHub profile
            │
            ▼
Backend creates/logs in user
            │
            ▼
Backend creates session
            │
            ▼
Backend sends session cookie
            │
            ▼
Browser stores cookie
            │
            ▼
Every future request automatically sends the cookie
```

---

# Authentication APIs

---

## 1. Start GitHub OAuth

### Endpoint

```http
GET /api/auth/github
```

### Purpose

Starts the GitHub OAuth flow.

### Backend Process

- Generate a random state value
- Save the state temporarily
- Redirect the user to GitHub OAuth

### Response

HTTP Redirect

```text
302 Redirect
```

GitHub Login Page opens.

---

### Learning Note

During the design phase we discussed whether this should be a POST request.

Although authentication eventually creates a session, this endpoint simply redirects the browser to GitHub.

Therefore **GET** is the correct method.

---

## 2. GitHub OAuth Callback

### Endpoint

```http
GET /api/auth/github/callback
```

### Query Parameters

```text
code
state
```

Example

```text
/api/auth/github/callback?code=abc123&state=xyz456
```

### Purpose

Handle GitHub's response after the user grants permission.

### Backend Process

Step 1

Verify the state parameter.

If the state is invalid:

Return

```http
401 Unauthorized
```

Step 2

Exchange the authorization code for a GitHub Access Token.

Step 3

Use the Access Token to fetch the user's GitHub profile.

Example GitHub information:

- GitHub ID
- Login
- Name
- Avatar
- Email

Step 4

Create a new user if they don't already exist.

Otherwise log the existing user in.

Step 5

Create a secure session.

Store the session identifier inside an HTTP-only cookie.

Step 6

Redirect the user to:

```text
/dashboard
```

---

### Learning Note

Initially we considered storing the GitHub Access Token inside our database.

For PRISM v1, we decided **not** to permanently store the token.

Instead:

- Use the Access Token to fetch the user's profile.
- Create our own authenticated session.
- Store only the session cookie in the browser.

This reduces security risks and keeps authentication under PRISM's control.

---

## 3. Get Current User

### Endpoint

```http
GET /api/auth/me
```

### Purpose

Returns information about the currently logged-in user.

The frontend uses this endpoint when:

- Refreshing the page
- Opening the dashboard
- Checking if the user is logged in

### Request

No request body.

Authentication happens automatically through the session cookie.

### Example Response

```json
{
  "success": true,
  "data": {
    "id": "u123",
    "name": "Maya",
    "login": "maya",
    "avatar": "https://..."
  }
}
```

---

### Learning Note

The frontend never sends:

```text
userId
```

The backend already knows who the user is by reading the session cookie.

This prevents users from pretending to be someone else.

---

## 4. Logout

### Endpoint

```http
POST /api/auth/logout
```

### Purpose

Ends the current user session.

### Backend Process

- Delete the session
- Clear the authentication cookie

### Response

```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

# Authentication Middleware

Every protected endpoint must verify that the user is authenticated.

Example protected routes:

```text
GET /api/repositories

GET /api/reviews

POST /api/reviews

GET /api/reviews/:id
```

---

### Middleware Process

```text
Incoming Request
        │
        ▼
Read Session Cookie
        │
        ▼
Session Exists?
     │
 ┌───┴────┐
 │        │
 ▼        ▼
Yes       No
 │         │
 ▼         ▼
Continue   401 Unauthorized
```

---

# Authentication Errors

Missing Cookie

```http
401 Unauthorized
```

Expired Session

```http
401 Unauthorized
```

Invalid OAuth State

```http
401 Unauthorized
```

GitHub OAuth Failure

```http
500 Internal Server Error
```

---

# Summary

Authentication is complete when:

- User grants GitHub permission
- Backend verifies the request
- Backend fetches the GitHub profile
- Backend creates or logs in the user
- Backend creates a secure session
- Browser stores only the session cookie
- User is redirected to the dashboard

At this point, all future requests use the session cookie for authentication.






---

# Repository APIs

After authentication is complete, the developer reaches the dashboard.

The dashboard displays all repositories the authenticated user has access to.

The frontend never calls GitHub directly.

Instead, the request always follows this path:

```text
Frontend
      │
GET /api/repositories
      │
      ▼
PRISM Backend
      │
      ▼
GitHub API
      │
      ▼
Transform Response
      │
      ▼
Frontend
```

---

## 1. Get User Repositories

### Endpoint

```http
GET /api/repositories
```

### Purpose

Return all repositories accessible to the currently authenticated user.

---

### Authentication

Required

The backend identifies the user using the session cookie.

The frontend does **not** send:

```text
userId
```

---

### Backend Process

Step 1

Authenticate the user.

↓

Step 2

Retrieve the GitHub Access Token (or generate one if using a GitHub App in future versions).

↓

Step 3

Call GitHub

```http
GET /user/repos
```

↓

Step 4

Receive GitHub's response.

↓

Step 5

Extract only the fields required by PRISM.

↓

Step 6

Return the cleaned response to the frontend.

---

### Why Don't We Return GitHub's Full Response?

GitHub returns hundreds of fields for every repository.

Example:

- Node ID
- URLs
- Fork information
- Permissions
- Branch URLs
- Events URL
- Clone URL
- Git URL
- Archive URLs
- Hooks URL
- Downloads URL
- Visibility
- Owner
- Watchers
- Topics
- Many more...

PRISM only needs a small subset.

Returning the entire response would:

- Increase payload size
- Slow down the frontend
- Expose unnecessary information
- Make frontend development harder

Therefore the backend acts as a translator.

---

### Example GitHub Response (Simplified)

```json
{
  "id": 123,
  "name": "PRISM",
  "full_name": "maya/PRISM",
  "private": false,
  "language": "TypeScript",
  "owner": {
    "login": "maya"
  },
  "updated_at": "...",
  "fork": false,
  "permissions": {},
  "...": "hundreds more fields"
}
```

---

### Response Sent to Frontend

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "PRISM",
      "owner": "maya",
      "visibility": "public",
      "language": "TypeScript",
      "updatedAt": "2026-07-12T12:30:00Z"
    }
  ]
}
```

---

### Learning Note

During the design phase we discussed sending GitHub's entire response directly to the frontend.

We decided against this.

Instead, the backend transforms GitHub's response into a smaller, frontend-friendly format.

This keeps the API stable even if GitHub changes its response structure in the future.

---

# Pull Request APIs

Once the developer selects a repository, PRISM loads all Pull Requests for that repository.

Flow

```text
Dashboard
      │
Select Repository
      │
      ▼
GET /api/repositories/:owner/:repo/pulls
      │
      ▼
Backend
      │
      ▼
GitHub API
      │
      ▼
Transform Response
      │
      ▼
Frontend
```

---

## 2. Get Pull Requests

### Endpoint

```http
GET /api/repositories/:owner/:repo/pulls
```

Example

```http
GET /api/repositories/maya/PRISM/pulls
```

---

### Purpose

Return all Pull Requests for the selected repository.

---

### Why Use owner and repo?

GitHub identifies repositories using:

```text
owner/repository
```

Example:

```text
vercel/next.js

facebook/react

maya/PRISM
```

Using both values guarantees the correct repository is selected.

---

### Backend Process

Authenticate User

↓

Receive owner and repo

↓

Call GitHub

```http
GET /repos/{owner}/{repo}/pulls
```

↓

Receive Pull Requests

↓

Transform Response

↓

Return Clean Data

---

### GitHub Returns

GitHub returns many fields.

Examples:

- Title
- Number
- State
- Body
- Merge Commit SHA
- Labels
- Milestone
- Assignees
- Requested Reviewers
- URLs
- Head Branch
- Base Branch
- Mergeable
- Comments
- Commits
- Many more...

---

### PRISM Returns

```json
{
  "success": true,
  "data": [
    {
      "number": 42,
      "title": "Fix Login Bug",
      "author": "maya",
      "status": "open",
      "createdAt": "...",
      "changedFiles": 8
    }
  ]
}
```

---

### Learning Note

Initially we thought the frontend would receive GitHub's complete Pull Request response.

Instead, the backend extracts only the information required to build the PR cards.

This reduces bandwidth and keeps the frontend independent from GitHub's API structure.

---

# Pagination

Large repositories may contain hundreds of Pull Requests.

Loading everything at once is inefficient.

Instead, PRISM supports pagination.

Example

```http
GET /api/repositories/maya/PRISM/pulls?page=1&limit=20
```

The backend forwards these values to GitHub when possible and returns only the requested page.

Benefits:

- Faster loading
- Less bandwidth
- Better user experience

---

# Validation

The backend validates every request.

Repository Validation

Missing owner

```http
400 Bad Request
```

Missing repository name

```http
400 Bad Request
```

Repository not found

```http
404 Not Found
```

User has no permission

```http
403 Forbidden
```

GitHub API unavailable

```http
500 Internal Server Error
```

---

# Security Notes

The frontend never receives:

- GitHub Access Token
- Client Secret
- OAuth Credentials
- Session Information

Only the backend communicates with GitHub.

This protects sensitive credentials from being exposed to the browser.

---

# Summary

Repository Flow

```text
Dashboard
      │
      ▼
GET /api/repositories
      │
      ▼
Backend
      │
      ▼
GitHub
      │
      ▼
Transform Response
      │
      ▼
Frontend
```

Pull Request Flow

```text
Repository Selected
        │
        ▼
GET /api/repositories/:owner/:repo/pulls
        │
        ▼
Backend
        │
        ▼
GitHub
        │
        ▼
Transform Response
        │
        ▼
Frontend
```

At this stage the frontend knows:

- Which repositories exist
- Which Pull Requests exist
- Which Pull Request the developer wants to review

The next step is starting the AI review process.


---

# AI Review APIs

This is the core feature of PRISM.

Once a developer selects a Pull Request and clicks **Review**, the backend begins an AI-powered review process.

Unlike authentication or repository APIs, this operation may take several seconds because it involves:

- Fetching changed files
- Filtering unnecessary files
- Preparing an AI prompt
- Calling the OpenAI API
- Processing AI responses
- Saving the final review

Since this process is time-consuming, the backend should **not** keep the frontend waiting.

Instead, it immediately creates a review job and processes it asynchronously.

---

# AI Review Flow

```text
Developer clicks Review
        │
        ▼
POST /api/reviews
        │
        ▼
Create Review Record
(Status = queued)
        │
        ▼
Return reviewId immediately
        │
        ▼
Background Review Process Starts
        │
        ▼
Fetch Changed Files
        │
        ▼
Filter Files
        │
        ▼
Build Prompt
        │
        ▼
Call OpenAI
        │
        ▼
Receive AI Response
        │
        ▼
Save Review
(Status = completed)
```

---

## Why Return Immediately?

Generating an AI review may take anywhere from a few seconds to over a minute.

If the frontend waits for the entire process:

- The browser appears frozen.
- The user receives no feedback.
- Long-running HTTP requests are more likely to fail.

Instead, PRISM returns immediately with a review identifier.

Example Response

```json
{
    "success": true,
    "data": {
        "reviewId": "review_123",
        "status": "queued"
    }
}
```

The frontend can immediately navigate to:

```text
/reviews/review_123
```

and display the current progress.

---

# Review Lifecycle

Every review moves through a lifecycle.

```text
queued
    │
    ▼
processing
    │
 ┌──┴───────────────┐
 │                  │
 ▼                  ▼
completed        failed
                     │
                     ▼
              Error Message
```

If the user stops the review:

```text
processing
      │
      ▼
cancelled
```

---

## Review Status Values

Possible review statuses:

| Status | Description |
|---------|-------------|
| queued | Review has been created and is waiting to start |
| processing | AI review is currently running |
| completed | Review finished successfully |
| failed | Review failed because of an unexpected error |
| cancelled | User stopped the review |

---

## Learning Note

Initially we only considered:

- processing
- completed
- cancelled

During the design phase we realized another important state was required.

### queued

This allows PRISM to create the review immediately while the actual AI processing starts shortly afterward.

We also decided **not** to create separate statuses such as:

- github_failed
- openai_failed

Instead, all failures use:

```text
failed
```

with an accompanying error message.

Example:

```text
Status:
failed

Error:
GitHub API rate limit exceeded.
```

This keeps the review lifecycle simple.

---

# Start AI Review

## Endpoint

```http
POST /api/reviews
```

---

## Purpose

Start a new AI review.

---

## Request

```json
{
    "owner": "maya",
    "repo": "PRISM",
    "pullNumber": 42
}
```

---

## Backend Process

Step 1

Authenticate the user.

↓

Step 2

Validate the request.

↓

Step 3

Create a Review record.

Status:

```text
queued
```

↓

Step 4

Return the Review ID.

↓

Step 5

Start the AI review process in the background.

---

## Example Response

```json
{
    "success": true,
    "data": {
        "reviewId": "review_123",
        "status": "queued"
    }
}
```

---

# Fetch Changed Files

The backend calls GitHub.

```http
GET /repos/{owner}/{repo}/pulls/{pull_number}/files
```

GitHub returns every changed file inside the Pull Request.

Example:

```text
src/login.ts

Navbar.tsx

README.md

package-lock.json

logo.png
```

---

# File Filtering

Not every file should be sent to the AI.

Files that provide little or no review value should be skipped.

Examples:

Images

```text
.png
.jpg
.svg
```

Lock Files

```text
package-lock.json

pnpm-lock.yaml

bun.lock
```

Generated Files

```text
dist/

build/

coverage/
```

Minified Files

```text
.min.js
```

Benefits:

- Lower API cost
- Faster review
- Better AI focus
- Smaller prompts

---

# Patch-Based Review

The AI does not need the entire repository.

Instead, PRISM reviews only the Pull Request changes.

GitHub provides a **patch** for each modified file.

Example

```diff
- const password = "123456"
+ const password = process.env.DB_PASSWORD
```

The patch contains exactly what changed.

This greatly reduces token usage.

---

## Learning Note

Originally we discussed sending entire files.

After studying GitHub's Pull Request API we learned that GitHub already provides patches.

Reviewing patches is:

- Faster
- Cheaper
- More focused

---

# Large Pull Requests

Some Pull Requests contain hundreds of changed files.

Sending everything in a single AI request would:

- Exceed token limits
- Increase costs
- Slow responses

Instead, PRISM processes files in smaller chunks.

Example

```text
Files 1–20
        │
        ▼
AI Review

Files 21–40
        │
        ▼
AI Review

Files 41–60
        │
        ▼
AI Review
```

The backend keeps the context from previous chunks while reviewing later chunks.

This ensures the AI maintains consistency across the entire Pull Request.

---

# Prompt Preparation

Before calling OpenAI, the backend prepares a structured prompt.

The prompt includes:

- Repository name
- Pull Request title
- Pull Request description
- Changed file names
- File patches
- Review instructions

Example instructions:

- Find security issues.
- Suggest performance improvements.
- Check code quality.
- Identify edge cases.
- Recommend best practices.

---

# OpenAI Request

The backend sends the prepared prompt to the AI model.

```text
Backend
      │
      ▼
OpenAI API
      │
      ▼
AI Review
```

The frontend never communicates directly with OpenAI.

---

# Save Review

Once the AI completes its analysis:

Update Review

```text
Status:
completed
```

Store:

- Summary
- Overall Score
- Security Suggestions
- Performance Suggestions
- Code Quality Feedback
- Best Practice Suggestions
- Edge Cases
- Full AI Response

Saving reviews provides:

- Review history
- Faster loading
- Lower OpenAI costs
- Future analytics

---

# Review History

## Endpoint

```http
GET /api/reviews
```

Purpose

Return every review belonging to the authenticated user.

The backend determines the user using the authenticated session.

The frontend never sends a userId.

---

# Get Single Review

## Endpoint

```http
GET /api/reviews/:id
```

Purpose

Return one specific review.

Before returning the review, the backend verifies that it belongs to the authenticated user.

If ownership verification fails:

```http
403 Forbidden
```

---

## Learning Note

Initially we considered sending a user identifier from the frontend.

Instead, the backend determines the current user from the authenticated session.

This prevents users from requesting another person's reviews.

---

# Cancel Review

## Endpoint

```http
POST /api/reviews/:id/cancel
```

Purpose

Stop an AI review that is currently processing.

The review is **not deleted**.

Instead:

```text
processing
      │
      ▼
cancelled
```

---

## Learning Note

Initially we considered:

```http
DELETE /api/reviews/:id
```

However, DELETE removes a resource permanently.

Cancelling a review only changes its state.

Using:

```http
POST /api/reviews/:id/cancel
```

better communicates the intention of the endpoint.

---

# Summary

The AI review pipeline follows this sequence:

```text
Developer Clicks Review
        │
        ▼
POST /api/reviews
        │
        ▼
Create Review Record
        │
        ▼
Return reviewId
        │
        ▼
Fetch Changed Files
        │
        ▼
Filter Files
        │
        ▼
Prepare Prompt
        │
        ▼
Chunk Large PRs
        │
        ▼
Call OpenAI
        │
        ▼
Receive AI Response
        │
        ▼
Save Review
        │
        ▼
Status = completed
        │
        ▼
GET /api/reviews/:id
        │
        ▼
Display AI Review
```

At this stage, the complete AI review pipeline has been designed.



---

# API Response Standard

To keep the backend predictable and easy to use, every endpoint should follow the same response structure.

## Success Response

```json
{
    "success": true,
    "message": "Repositories fetched successfully.",
    "data": {}
}
```

---

## Error Response

```json
{
    "success": false,
    "message": "Repository not found."
}
```

---

## Why Use a Standard Response?

Using the same response structure for every endpoint makes frontend development easier.

Benefits:

- Predictable API behavior
- Easier error handling
- Cleaner frontend code
- Easier debugging

---

# HTTP Status Codes

PRISM follows standard HTTP status codes.

| Status Code | Meaning | Example |
|-------------|----------|---------|
| 200 | Success | Repository fetched |
| 201 | Resource Created | Review created |
| 400 | Bad Request | Missing pullNumber |
| 401 | Unauthorized | User not logged in |
| 403 | Forbidden | Review belongs to another user |
| 404 | Not Found | Repository or Review not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected backend error |

---

## Learning Note

During the design phase we initially thought that missing request data should return:

```http
500 Internal Server Error
```

After discussing HTTP status codes, we corrected it.

Missing request fields are caused by the client.

Therefore the correct response is:

```http
400 Bad Request
```

A **500** error should only be used when the backend fails unexpectedly.

---

# Request Validation

Every incoming request should be validated before processing.

Example

POST /api/reviews

Required fields:

- owner
- repo
- pullNumber

If any required field is missing:

```http
400 Bad Request
```

Example

```json
{
    "success": false,
    "message": "pullNumber is required."
}
```

Validation prevents unnecessary API calls and protects the backend from invalid data.

---

# Authentication Rules

The following endpoints require authentication:

```http
GET /api/repositories

GET /api/repositories/:owner/:repo/pulls

POST /api/reviews

GET /api/reviews

GET /api/reviews/:id

POST /api/reviews/:id/cancel
```

The backend authenticates users using the session cookie.

The frontend never sends:

- userId
- sessionId
- GitHub Access Token

---

# Authorization Rules

Authentication answers:

> "Who is the user?"

Authorization answers:

> "Can this user access this resource?"

Example

User A requests:

```http
GET /api/reviews/review123
```

Backend checks:

```text
Does review123 belong to User A?
```

If yes:

```http
200 OK
```

If no:

```http
403 Forbidden
```

---

# Rate Limiting

To protect PRISM from abuse, rate limiting should be applied.

Examples

Authentication

```text
10 requests / minute
```

Review Creation

```text
5 reviews / minute
```

Repository Fetch

```text
60 requests / minute
```

Benefits

- Prevent spam
- Protect OpenAI usage
- Reduce unnecessary costs
- Improve server stability

---

# Logging

The backend should log important events.

Examples

Authentication

```text
User maya logged in.
```

Review Started

```text
Review review_123 started.
```

Review Completed

```text
Review review_123 completed.
```

Review Failed

```text
GitHub API rate limit exceeded.
```

These logs help during debugging and production monitoring.

---

# Error Handling Strategy

Whenever an unexpected error occurs:

Backend should

- Catch the exception
- Log the error
- Return a safe error message

Avoid exposing:

- Stack traces
- Database errors
- API keys
- Internal implementation details

Example

Instead of:

```text
PrismaClientKnownRequestError...
```

Return

```json
{
    "success": false,
    "message": "Something went wrong. Please try again later."
}
```

---

# Security Best Practices

PRISM should follow these security principles:

- Never expose API keys
- Never expose GitHub tokens
- Store secrets in environment variables
- Validate every request
- Authenticate every protected endpoint
- Authorize every resource access
- Use HTTPS in production
- Use HTTP-only cookies for sessions
- Sanitize user input
- Never trust frontend data

---

# Complete Backend Flow

```text
Developer
      │
      ▼
Landing Page
      │
      ▼
Connect GitHub
      │
      ▼
GET /api/auth/github
      │
      ▼
GitHub OAuth
      │
      ▼
GET /api/auth/github/callback
      │
      ▼
Create Session
      │
      ▼
Dashboard
      │
      ▼
GET /api/repositories
      │
      ▼
Select Repository
      │
      ▼
GET /api/repositories/:owner/:repo/pulls
      │
      ▼
Select Pull Request
      │
      ▼
POST /api/reviews
      │
      ▼
Background Processing
      │
      ▼
Fetch Changed Files
      │
      ▼
Filter Files
      │
      ▼
Prepare Prompt
      │
      ▼
Chunk Large PR
      │
      ▼
Call OpenAI
      │
      ▼
Save Review
      │
      ▼
GET /api/reviews/:id
      │
      ▼
Display Review
```

---

# API Endpoint Summary

| Method | Endpoint | Purpose |
|----------|----------|----------|
| GET | /api/auth/github | Start GitHub OAuth |
| GET | /api/auth/github/callback | Handle OAuth callback |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/logout | Logout user |
| GET | /api/repositories | Get repositories |
| GET | /api/repositories/:owner/:repo/pulls | Get pull requests |
| POST | /api/reviews | Start AI review |
| GET | /api/reviews | Get review history |
| GET | /api/reviews/:id | Get single review |
| POST | /api/reviews/:id/cancel | Cancel review |

---

# Conclusion

This document defines the complete backend architecture for PRISM v1.

By designing the backend before implementation, we have:

- Defined all API endpoints.
- Established authentication and authorization rules.
- Planned the AI review pipeline.
- Standardized API responses.
- Defined validation and error handling.
- Identified security best practices.

The next phase of the project is designing the database schema, where these API endpoints will be connected to persistent data storage.

Once the database design is complete, implementation can begin with a clear understanding of how every backend component should interact.
