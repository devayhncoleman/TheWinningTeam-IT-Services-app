# IT Services Platform – API Design

Version: 1.0  
Owner: Team A – The Winning Team  
Last Updated: 2026-01-06

---

## 1. Overview

This document defines the HTTP API for **The Winning Team IT Services Platform**.

The platform supports:

- Customers creating & tracking IT tickets  
- Technicians working and updating tickets  
- Admins managing users, groups, and assignments  
- Real-time-style ticket messaging

The backend is built on:

- **API Gateway** – HTTP API entrypoint  
- **AWS Lambda (Python)** – business logic  
- **DynamoDB** – data storage (Users, Groups, Tickets, Messages)

This document is the **contract** between:

- Backend implementation (Lambdas)
- Web & mobile frontends
- Admin tools

---

## 2. Architecture & Base URLs

### 2.1 Environments

| Environment | Description            | Base URL (example)                                   |
|------------|------------------------|------------------------------------------------------|
| dev        | Developer / testing    | `https://<dev-api-id>.execute-api.us-east-1.amazonaws.com` |
| prod       | Production / demo      | `https://<prod-api-id>.execute-api.us-east-1.amazonaws.com` |

> Frontend apps **must** treat the base URL as configurable per environment.

### 2.2 General Conventions

- All requests and responses use **JSON**.
- All times are **ISO 8601** in UTC, e.g. `2026-01-06T21:13:45Z`.
- IDs are opaque strings (UUIDs or generated IDs) – frontends must not infer structure.
- API is versioned logically by contract; URL versioning can be added later if needed.

---

## 3. Authentication & Identity

### 3.1 Current (Development / Demo Mode)

For development & demos, identity is resolved in this order:

1. **`x-user-id` header**
   - If present, this is treated as the current user ID.
   - Example: `x-user-id: customer_ashley`

2. **Cognito JWT (future-ready)**
   - If a valid Cognito JWT is attached (e.g., `Authorization: Bearer <token>`), the backend will read `sub` and role claims.
   - This is not fully enforced yet but the code is structured to support it.

3. **Fallback demo user**
   - If no header / token is provided, the system uses a fallback user:  
     `userId = "demo-user"` (read-only / limited capabilities).

### 3.2 Future (Cognito-Backed Auth – Target Design)

Planned auth:

- Cognito User Pool for signup/login
- Custom claim for role (e.g., `custom:role = "CUSTOMER" | "TECH" | "ADMIN"`)
- API Gateway JWT authorizer enforcing tokens on protected routes

The backend helper `get_current_user()` will:

1. Check Cognito JWT → extract `userId` and `role`  
2. Allow header override in dev / test environments  
3. Fallback to `demo-user` only for non-critical endpoints

---

## 4. Roles & Permissions

### 4.1 Roles

- **CUSTOMER**
  - Creates tickets
  - Views and comments on their own tickets
- **TECH**
  - Sees tickets assigned to them or their group
  - Updates ticket status/priority where allowed
  - Participates in ticket messaging
- **ADMIN**
  - Manages users and groups
  - Assigns tickets
  - Views all tickets

### 4.2 Permission Matrix (High-Level)

| Action                                      | CUSTOMER | TECH    | ADMIN   |
|--------------------------------------------|----------|---------|---------|
| Create ticket                              | ✅       | ✅ (for others / internal) | ✅ |
| List my tickets                            | ✅       | ✅      | ✅      |
| View single ticket                         | ✅ (own) | ✅ (assigned / group) | ✅ |
| Update ticket status/priority              | ❌       | ✅ (assigned / group) | ✅ |
| Mark / update emergency flag               | ✅ (on create) | ✅ | ✅ |
| Send ticket message                        | ✅ (own ticket) | ✅ (assigned / group) | ✅ |
| View ticket messages                       | ✅ (own ticket) | ✅ (assigned / group) | ✅ |
| Create users                               | ❌       | ❌      | ✅      |
| Create groups                              | ❌       | ❌      | ✅      |
| Assign ticket to tech/group                | ❌       | ❌      | ✅      |
| List all users                             | ❌       | ❌      | ✅      |
| List all groups                            | ❌       | ❌      | ✅      |
| List all tickets                           | ❌       | ❌      | ✅      |

---

## 5. Data Models

> Note: Field names reflect the current Lambda & DynamoDB design.  
> If implementation uses slightly different names, they should be updated here to match reality.

### 5.1 User

**DynamoDB Table:** `Users`

```json
{
  "userId": "customer_ashley",
  "email": "ashley@example.com",
  "displayName": "Ashley",
  "role": "CUSTOMER",
  "groupIds": ["group_level_1"],
  "createdAt": "2026-01-05T20:15:30Z",
  "updatedAt": "2026-01-05T20:15:30Z",
  "isActive": true
}

5.2 Group

DynamoDB Table: Groups

{
  "groupId": "group_level_1",
  "name": "Level 1 Support",
  "description": "Front-line IT support team",
  "createdAt": "2026-01-05T20:15:30Z",
  "updatedAt": "2026-01-05T20:15:30Z"
}

5.3 Ticket

DynamoDB Table: Tickets

