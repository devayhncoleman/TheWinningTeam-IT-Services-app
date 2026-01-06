# API Design — TheWinningTeam IT Services API

This document defines the HTTP API for the IT services platform.

The API is intended to be implemented using:

- **Amazon API Gateway** (HTTP API or REST API)
- **AWS Lambda** (Node.js or Python)
- **Amazon DynamoDB** (as defined in `database-schema.md`)

---

## 1. High-Level API Overview

### 1.1 Resources

- **Auth** (future enhancement)
- **Tickets** (customer + technician operations)
- **Ticket Messages** (chat inside tickets)
- **Emergency Endpoint** (escalation path)
- **Admin/Org Management** (users, groups, assignments)

### 1.2 General Conventions

- All responses are JSON.
- Timestamps use ISO 8601 (e.g., `"2026-01-05T18:20:00Z"`).
- Authentication/authorization assumed via:
  - Cognito, or
  - Custom auth (JWT in `Authorization` header)
- The caller’s identity (`userId`, `role`) is made available to Lambda via auth context.

---

## 2. Tickets API

### 2.1 Create Ticket

**Endpoint**

```http
POST /tickets












# API Design (Planned — AWS Lambda + API Gateway)

## Ticket Endpoints
POST   /tickets
GET    /tickets/{id}
GET    /tickets?user={id}
PATCH  /tickets/{id}
POST   /tickets/{id}/messages

## Admin Endpoints
POST   /groups
POST   /users
PATCH  /assign
GET    /admin/tickets

## Emergency
POST   /emergency

