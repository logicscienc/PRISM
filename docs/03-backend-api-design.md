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
Developer
      │
      ▼
Connect GitHub
      │
      ▼
GitHub Login
      │
      ▼
Permission Screen
      │
      ▼
GitHub returns Authorization Code
      │
      ▼
Backend exchanges Code
for Access Token
      │
      ▼
Backend fetches GitHub Profile
      │
      ▼
Create/Login User
      │
      ▼
Create Session
      │
      ▼
Redirect to Dashboard
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
