# Create Review

This document describes the first stage of PRISM's AI Review Engine.

The purpose of this endpoint is **not** to generate an AI review immediately.

Instead, its responsibility is to create a review job, validate the request, and hand the work over to the background review process.

---

# Endpoint

```http
POST /api/reviews
```

---

# Purpose

Create a new AI review request for a Pull Request.

The endpoint performs initial validation, creates a Review record in the database, and immediately returns a Review ID.

The actual AI review starts asynchronously after the response has been returned.

---

# Why Create a Review First?

Generating an AI review is a long-running operation.

The backend must:

- Authenticate the user
- Communicate with GitHub
- Fetch Pull Request information
- Fetch changed files
- Filter unnecessary files
- Build an optimized AI prompt
- Call the AI model
- Parse the AI response
- Save the review results

This process may take several seconds.

Instead of making the user wait, PRISM creates a Review record immediately.

This allows the frontend to display progress while the AI review continues in the background.

---

# Request

```json
{
    "owner": "maya",
    "repo": "PRISM",
    "pullNumber": 42
}
```

---

# Validation

Before creating a review, PRISM validates the request.

Validation includes:

- User is authenticated
- GitHub access token exists
- Repository owner is provided
- Repository name is provided
- Pull Request number is provided
- Repository exists on GitHub

If any validation fails, the review is not created.

---

# Workflow

```text
Developer clicks Review
        │
        ▼
POST /api/reviews
        │
        ▼
Authenticate User
        │
        ▼
Validate Request
        │
        ▼
Fetch Repository
        │
        ▼
Create Review
(Status = QUEUED)
        │
        ▼
Return reviewId
        │
        ▼
Background Review Process Starts
```

---

# Review Record

A new Review is inserted into the database.

Initially:

Status

```
QUEUED
```

At this point no AI processing has started.

The Review simply represents a queued review job.

---

# Example Database Record

```text
Review

id: review_123

userId: ...

githubRepoId: ...

owner: maya

repo: PRISM

prNumber: 42

status: QUEUED

aiModel: gpt-5
```

---

# Response

```json
{
    "success": true,
    "data": {
        "reviewId": "review_123",
        "status": "QUEUED"
    }
}
```

The frontend immediately receives the Review ID.

This allows the user interface to navigate to:

```
/reviews/review_123
```

and display live review progress.

---

# Why Return Immediately?

Keeping the HTTP request open until the AI finishes would create several problems.

- Poor user experience
- Browser timeouts
- Long-running HTTP requests
- Difficult retry handling

Returning immediately allows PRISM to process reviews reliably in the background while keeping the application responsive.

---

# Next Step

After the Review has been created, PRISM starts the Background Review Process.

The background worker is responsible for:

- Fetching Pull Request details
- Fetching changed files
- Filtering files
- Building the AI prompt
- Calling OpenAI
- Saving the final review
- Updating the Review status
