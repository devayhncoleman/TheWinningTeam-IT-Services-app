# API Design — TheWinningTeam IT Services API

This document defines the HTTP API for **TheWinningTeam**, an IT services platform built on:

- Amazon API Gateway (HTTP API)
- AWS Lambda (Python)
- Amazon DynamoDB (see `database-schema.md`)

All responses are JSON. Timestamps use ISO 8601 (e.g., `"2026-01-06T09:23:34.289634Z"`).

> Note: Authentication and real user/role context will be added later (e.g., via Amazon Cognito). For now, `userId` is hard-coded as `"demo-user"` in backend logic.

---

## 1. Resources & Endpoints (Current)

### 1.1 Tickets

**Lambda:** `TicketsHandlerPython`  
**Table:** `Tickets`

**Implemented endpoints:**

| Method | Path           | Description                           |
|--------|----------------|---------------------------------------|
| POST   | `/tickets`     | Create a new ticket                   |
| GET    | `/tickets`     | List tickets for the current user     |

**Planned / future (not yet implemented):**

| Method | Path                      | Description                       |
|--------|---------------------------|-----------------------------------|
| GET    | `/tickets/{ticketId}`     | Get a single ticket by ID         |
| PATCH  | `/tickets/{ticketId}`     | Update ticket status/fields       |

---

#### 1.1.1 Create Ticket

**Endpoint**

```http
POST /tickets
