# PRISM – Database Design

> **Version:** v1.0
> **Status:** Database Planning
> **Goal:** Design a simple, scalable database that supports PRISM v1 while leaving room for future improvements.

---

# Why do we need a database?

PRISM integrates with GitHub, but not everything should be stored inside our own database.

A good rule to follow is:

> **Only store data that PRISM owns.**

For example:

- User information → ✅ Store
- Login sessions → ✅ Store
- AI Reviews → ✅ Store
- GitHub repositories → ❌ Fetch from GitHub
- Pull Requests → ❌ Fetch from GitHub

GitHub remains the source of truth for repositories and Pull Requests.

---

# Database Tables

For PRISM v1 we will use four tables.

```
User
│
├─────────────┐
│             │
▼             ▼
Session      Review
                │
                ▼
          ReviewResult
```

---

# 1. User Table

Purpose

Stores information about users who sign in using GitHub.

Fields

- id (Primary Key)
- githubId
- login
- name
- email
- avatarUrl
- createdAt
- updatedAt

---

## Why do we store this?

Although GitHub already has this information, PRISM needs its own users.

After GitHub authentication, the backend fetches the user's profile and stores only the necessary information.

---

# Learning Note

Initially we discussed storing the GitHub Access Token in the database.

For PRISM v1 we decided **not** to permanently store it.

Instead:

- GitHub returns an Access Token.
- Backend fetches the user's GitHub profile.
- Backend creates its own authenticated session.
- Backend sends a session cookie to the browser.
- Future requests use the session cookie instead of the GitHub Access Token.

This improves security and gives PRISM full control over authentication.

---

# 2. Session Table

Purpose

Stores active login sessions.

Fields

- id (Primary Key)
- userId (Foreign Key)
- sessionId
- expiresAt
- createdAt

Relationship

```
User (1)
    │
    ▼
Session (Many)
```

---

## Why is it One-to-Many?

At first it looked like One-to-One because we decided to allow only one active login.

However, database relationships are different from business rules.

Example

January

Login

↓

Session A

↓

Logout

February

Login

↓

Session B

↓

Logout

One user creates many sessions over time.

Our business rule simply says:

> Only one ACTIVE session should exist at a time.

Whenever a user logs in again:

- Delete the previous active session.
- Create a new one.
- Send a new session cookie.

---

# 3. Review Table

Purpose

Stores every AI review request.

Fields

- id (Primary Key)
- userId (Foreign Key)
- owner
- repo
- prNumber
- status
- createdAt
- startedAt
- completedAt
- updatedAt

Relationship

```
User (1)
      │
      ▼
Review (Many)
```

---

## Review Status

Possible values

- queued
- processing
- completed
- failed
- cancelled

---

## Why create the Review immediately?

When the user clicks **Review**, we immediately create a Review record.

```
User clicks Review

↓

Create Review

status = queued

↓

AI starts

↓

status = processing

↓

completed / failed
```

Advantages

- Better user experience
- Easy progress tracking
- Easier debugging
- Failed reviews are still recorded

---

# Recovery

Suppose the server crashes while the AI is reviewing a Pull Request.

When the server starts again:

- Check for Reviews with status:
  - queued
  - processing

Resume or retry them.

This prevents users from losing long-running reviews.

---

# 4. ReviewResult Table

Purpose

Stores the AI-generated review.

Fields

- id (Primary Key)
- reviewId (Foreign Key)
- score
- summary
- security
- performance
- codeQuality
- edgeCases
- bestPractices
- rawResponse
- createdAt

---

## Why a separate table?

Initially we considered storing everything inside one field.

Example

```
result
```

Instead we decided to store important sections separately.

Benefits

- Easy to display in the UI.
- Easy to search.
- Easy to calculate scores.
- Better future scalability.

The rawResponse field stores the original AI response for future features such as exporting or regenerating reports.

---

# Relationship

```
Review
      │
      ▼
ReviewResult
```

For PRISM v1:

One Review produces one AI Result.

Although we designed a separate table, it also allows future expansion if PRISM later supports multiple AI models.

---

# Repository Table?

Decision

No.

Reason

Repositories belong to GitHub.

Whenever the dashboard opens:

```
Frontend

↓

Backend

↓

GitHub API

↓

Latest Repositories
```

This guarantees that the user always sees the latest repositories without needing synchronization.

---

# Review History

The Review History page should return only summary information.

Example

- Repository
- Pull Request
- Status
- Score
- Created At

When the user clicks a review:

```
GET /api/reviews/:id
```

The backend returns the complete Review and ReviewResult.

This keeps the application fast and reduces unnecessary database queries.

---

# Delete Account

If a user deletes their PRISM account:

Delete

- User
- Sessions
- Reviews
- ReviewResults

Everything should be removed.

This keeps the database clean and respects user privacy.

---

# Database Relationships

```
User
│
├──────────────┐
│              │
▼              ▼
Session      Review
                 │
                 ▼
           ReviewResult
```

---

# Learning Notes

## Database Relationship vs Business Rule

One of the biggest confusions during the design phase was:

"If only one login is allowed, shouldn't User and Session be One-to-One?"

Answer:

No.

A database relationship describes what can happen over time.

A business rule describes what the application allows.

One user can create many sessions over their lifetime.

Our application simply deletes the previous active session whenever a new login occurs.

---

## Why don't we store GitHub repositories?

GitHub already owns repository information.

Duplicating it would create synchronization problems.

Instead, PRISM requests the latest repositories whenever the dashboard loads.

---

## Why separate Review and ReviewResult?

The Review table represents the review process.

The ReviewResult table represents what the AI generated.

Keeping them separate makes the design cleaner and easier to extend in future versions.

---

# Final Database

```
User
│
├──────────────┐
│              │
▼              ▼
Session      Review
                 │
                 ▼
           ReviewResult
```

This design is intentionally simple.

It supports all features planned for PRISM v1 while leaving enough flexibility for future versions such as multiple AI models, automatic reviews, and GitHub App integration.
