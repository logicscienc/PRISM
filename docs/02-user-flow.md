# PRISM - User Flow

> **Version:** v1.0
> **Purpose:** Describe how a developer interacts with PRISM from the first visit to receiving an AI-powered code review.

---

# Overview

The goal of PRISM is to provide developers with an AI-generated review of their GitHub Pull Requests before the code is merged.

The user only performs a few actions, while PRISM handles the complex work in the background.

---

# User Flow

```text
Developer visits PRISM
        │
        ▼
Reads product information
        │
        ▼
Clicks "Connect GitHub"
        │
        ▼
Redirected to GitHub Login
        │
        ▼
Grants permission to PRISM
        │
        ▼
GitHub redirects back to PRISM
        │
        ▼
Backend exchanges authorization code
for GitHub Access Token
        │
        ▼
User Dashboard
        │
        ▼
Repositories are displayed
        │
        ▼
Developer selects a repository
        │
        ▼
PRISM fetches Pull Requests
        │
        ▼
Developer selects a Pull Request
        │
        ▼
Developer clicks "Review"
        │
        ▼
PRISM fetches changed files
        │
        ▼
Filters unnecessary files
        │
        ▼
Builds AI prompt
        │
        ▼
Sends request to OpenAI
        │
        ▼
Receives AI response
        │
        ▼
Displays AI Review Report
```

---

# Step-by-Step Journey

## 1. Landing Page

The developer visits PRISM and learns what the platform does.

Visible components:

- Hero Section
- Features
- Benefits
- Connect GitHub Button

---

## 2. GitHub Authentication

The developer clicks **Connect GitHub**.

GitHub asks the developer to authorize PRISM.

After permission is granted, GitHub redirects the developer back to PRISM.

---

## 3. Dashboard

After authentication, PRISM displays the developer's dashboard.

The dashboard contains:

- Connected GitHub Account
- Repository List
- Recent Reviews (Future)
- Review History (Future)

---

## 4. Repository Selection

The developer chooses one repository.

PRISM then requests all Pull Requests for that repository.

---

## 5. Pull Request Selection

PRISM displays available Pull Requests.

Each Pull Request shows:

- Title
- Author
- Status
- Created Date
- Changed Files Count

The developer selects one Pull Request.

---

## 6. AI Review

When the developer clicks **Review**, PRISM begins processing.

Background process:

- Fetch changed files
- Remove unnecessary files
- Build AI prompt
- Send prompt to OpenAI
- Receive AI review

---

## 7. Review Report

The developer receives an AI-generated review containing:

- Overall Summary
- Security Issues
- Performance Suggestions
- Code Quality Feedback
- Edge Cases
- Best Practices
- Suggested Improvements
- Final Recommendation

---

# Notes

## Large Pull Requests

Large Pull Requests may contain hundreds of changed files.

Instead of sending every file to the AI at once, PRISM should:

- Process files in smaller batches.
- Preserve useful context between batches.
- Generate one final review after all batches are processed.

---

# Principles

PRISM should:

- Keep the user experience simple.
- Hide technical complexity from the developer.
- Minimize AI token usage.
- Review only relevant files.
- Generate actionable feedback instead of generic suggestions.
