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
