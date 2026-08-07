# AI Review Engine

The AI Review Engine is the core of PRISM.

Authentication allows users to sign in.

Repository APIs allow users to browse their repositories.

Pull Request APIs allow users to inspect GitHub Pull Requests.

However, none of these features are the primary purpose of PRISM.

The reason PRISM exists is to review code using Artificial Intelligence.

Everything else in the application exists to support this single workflow.

This is why the AI Review Engine is considered the brain of the system.

---

## Why is it the Brain of PRISM?

The AI Review Engine is responsible for turning a GitHub Pull Request into meaningful engineering feedback.

It performs much more than a single API call.

The review process involves:

- validating the request,
- creating a review record,
- communicating with GitHub,
- collecting Pull Request information,
- filtering unnecessary files,
- preparing an optimized AI prompt,
- sending the request to the AI model,
- processing the AI response,
- storing the final review,
- updating the review status.

Every major component of PRISM eventually connects to this workflow.

Without the AI Review Engine, PRISM would simply be another GitHub dashboard.

---

## Design Goals

The AI Review Engine is designed with the following goals:

- Production-ready architecture
- Reliable review lifecycle
- Minimal GitHub API usage
- Efficient OpenAI token usage
- Support for long-running reviews
- Scalable background processing
- Clear separation of responsibilities
- Extensible for future AI models

---

## High-Level Workflow

```text
Developer clicks Review
        │
        ▼
POST /api/reviews
        │
        ▼
Create Review (QUEUED)
        │
        ▼
Return reviewId
        │
        ▼
Background Review Process
        │
        ▼
Fetch Pull Request
        │
        ▼
Fetch Pull Request Files
        │
        ▼
Filter Files
        │
        ▼
Build AI Prompt
        │
        ▼
OpenAI
        │
        ▼
Parse AI Response
        │
        ▼
Save ReviewResult
        │
        ▼
Update Review Status
(COMPLETED / FAILED)
```

---

## Why Use Background Processing?

Generating an AI review is not an instant operation.

A single review may involve:

- multiple GitHub API requests,
- filtering dozens of changed files,
- preparing thousands of tokens,
- communicating with an LLM,
- parsing the AI response,
- storing structured review results.

This process may take several seconds or even longer for large Pull Requests.

Instead of keeping the HTTP request open, PRISM immediately creates a Review record and returns a Review ID.

The actual AI review continues asynchronously in the background.

This keeps the application responsive while allowing long-running reviews to complete safely.

---

## Review Lifecycle

```text
QUEUED
   │
   ▼
PROCESSING
   │
 ┌─┴───────────────┐
 │                 │
 ▼                 ▼
COMPLETED       FAILED
                     │
                     ▼
             Error Message
```

Every review always exists in the database before AI processing begins.

This allows the frontend to track progress and recover gracefully if an unexpected failure occurs.