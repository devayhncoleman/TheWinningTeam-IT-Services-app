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
```

### 5.2 Group

**DynamoDB Table:** `Groups`

```json
{
  "groupId": "group_level_1",
  "name": "Level 1 Support",
  "description": "Front-line IT support team",
  "createdAt": "2026-01-05T20:15:30Z",
  "updatedAt": "2026-01-05T20:15:30Z"
}
```

### 5.3 Ticket

**DynamoDB Table:** `Tickets`

```json
{
  "ticketId": "ticket_c8d8e023b41a49cba8e24320592c696c",
  "title": "VPN not connecting",
  "description": "I cannot connect to the corporate VPN from home.",
  "status": "OPEN",            // e.g. OPEN, IN_PROGRESS, RESOLVED, CLOSED
  "priority": "NORMAL",        // e.g. LOW, NORMAL, HIGH, CRITICAL
  "isEmergency": "NORMAL",     // NORMAL | EMERGENCY
  "isEmergencyBool": false,
  "createdByUserId": "customer_ashley",
  "assignedTechId": "tech_mike",          // optional
  "assignedGroupId": "group_level_1",     // optional
  "createdAt": "2026-01-05T20:15:30Z",
  "updatedAt": "2026-01-05T21:02:10Z"
}
```

### 5.4 Ticket Message

**DynamoDB Table:** `TicketMessages`
**Partition key:** `ticketId`
**Sort key:** `messageTimestamp`
```json
{
  "ticketId": "ticket_c8d8e023b41a49cba8e24320592c696c",
  "messageTimestamp": "2026-01-05T20:20:01Z",
  "senderUserId": "customer_ashley",
  "senderRole": "CUSTOMER",
  "content": "Here is a screenshot of the error.",
  "isSystem": false
}
```

## 6. Endponts

### 6.1 Tickets

#### 6.1.1 Create Ticket
**Method:** `POST`
**Route:** `/tickets`
**Auth:** `Required(header based or future JWT)`
**Roles:** `CUSTOMER,TECH,ADMIN`

**Headers:**
**Content-Type:** `application/json`
**x-user-id:** `<userId>` ### (dev/demo) - optional once JWT is in place

**Request Body:**
```json
{
  "title": "VPN not connecting",
  "description": "I cannot connect to the corporate VPN from home.",
  "priority": "HIGH",          // optional, defaults to NORMAL
  "isEmergency": "EMERGENCY"   // optional, NORMAL | EMERGENCY
}
```
**Response 201 Created:**
```json
{
  "ticketId": "ticket_c8d8e023b41a49cba8e24320592c696c",
  "title": "VPN not connecting",
  "description": "I cannot connect to the corporate VPN from home.",
  "status": "OPEN",
  "priority": "HIGH",
  "isEmergency": "EMERGENCY",
  "isEmergencyBool": true,
  "createdByUserId": "customer_ashley",
  "assignedTechId": null,
  "assignedGroupId": null,
  "createdAt": "2026-01-05T20:15:30Z",
  "updatedAt": "2026-01-05T20:15:30Z"
}
```
**Error Responses:**
`400 INVALID_REQUEST` **- missing title/description**
`401 UNAUTHENTICATED` **- no valid identity**
`500 INTERNAL_ERROR` **unexepected error**

### 6.1.2 List My Tickets
**Method:** `GET`
**Route:** `/tickets`
**Auth:** `Required`
**Roles:**
CUSTOMER → tickets created by that user

TECH → tickets assigned to that tech or their groups (depending on implementation)

ADMIN → all tickets, or this route may still be “my tickets” only

Query Parameters (optional, future-friendly):

status – filter by status

isEmergency – NORMAL or EMERGENCY

limit – max number to return (e.g., default 50)

cursor – pagination token (if implemented)

**Response 200 OK:**
```json
{
  "items": [
    {
      "ticketId": "ticket_c8d8e023b41a49cba8e24320592c696c",
      "title": "VPN not connecting",
      "status": "OPEN",
      "priority": "HIGH",
      "isEmergency": "EMERGENCY",
      "isEmergencyBool": true,
      "createdByUserId": "customer_ashley",
      "assignedTechId": "tech_mike",
      "assignedGroupId": "group_level_1",
      "createdAt": "2026-01-05T20:15:30Z",
      "updatedAt": "2026-01-05T21:02:10Z"
    }
  ],
  "nextCursor": null
}
```

### 6.1.3 Get Single Ticket
**Method:** `GET`
**Route:** `/tickets/{ticketId}`
**Auth:** `Required`

**Path Params:**
'ticketId' **- ID of the ticket**

**Response 200 OK:**
```json
{
  "ticketId": "ticket_c8d8e023b41a49cba8e24320592c696c",
  "title": "VPN not connecting",
  "description": "I cannot connect to the corporate VPN from home.",
  "status": "OPEN",
  "priority": "HIGH",
  "isEmergency": "EMERGENCY",
  "isEmergencyBool": true,
  "createdByUserId": "customer_ashley",
  "assignedTechId": "tech_mike",
  "assignedGroupId": "group_level_1",
  "createdAt": "2026-01-05T20:15:30Z",
  "updatedAt": "2026-01-05T21:02:10Z"
}
```

**Error Responses:**
`404 NOT_FOUND` **- ticket does not exist or not visible to this user**
`403 FORBIDDEN` **- user not allowed to view**

### 6.1.4 Update Ticket (Status/Priority)
**Method:** `PATCH`
**Route:** `/tickets/{ticketId}`
**Auth: Required**
**Roles: TECH, ADMIN(CUSTOMER might be restricted from status/priority updates)**

**Path Params:**
`ticketId`

**Request Body (partial update):**

```json
{
  "status": "IN_PROGRESS",   // optional
  "priority": "CRITICAL"     // optional
}
```

**Response 200 OK:**
```json
{
  "ticketId": "ticket_c8d8e023b41a49cba8e24320592c696c",
  "title": "VPN not connecting",
  "description": "I cannot connect to the corporate VPN from home.",
  "status": "IN_PROGRESS",
  "priority": "CRITICAL",
  "isEmergency": "EMERGENCY",
  "isEmergencyBool": true,
  "createdByUserId": "customer_ashley",
  "assignedTechId": "tech_mike",
  "assignedGroupId": "group_level_1",
  "createdAt": "2026-01-05T20:15:30Z",
  "updatedAt": "2026-01-05T21:30:00Z"
}
```
**Error Responses:**
`400 INVALID_REQUEST` **- invalid status/priority**
`403 FORBIDDEN` **- user not allowed to modify**
`404 NOT_FOUND` **- ticket not found**

## 6.2 Ticket Messages

### 6.2.1 List Ticket Messages
**Method:** `GET`
**Route:** `/tickets/{ticketId}/messages`
**Auth: Required**
**Roles: CUSTOMER(own)/ TECH?ADMIN(assigned / global)**

**Response 200 OK:**
```json
{
  "items": [
    {
      "ticketId": "ticket_c8d8e023b41a49cba8e24320592c696c",
      "messageTimestamp": "2026-01-05T20:20:01Z",
      "senderUserId": "customer_ashley",
      "senderRole": "CUSTOMER",
      "content": "Here is a screenshot of the error.",
      "isSystem": false
    },
    {
      "ticketId": "ticket_c8d8e023b41a49cba8e24320592c696c",
      "messageTimestamp": "2026-01-05T20:25:10Z",
      "senderUserId": "tech_mike",
      "senderRole": "TECH",
      "content": "We're looking into this now.",
      "isSystem": false
    }
  ]
}
```
### 6.2.2 Send Ticket Message
**Method:** `POST`
**Route:** `/tickets/{ticketId}/messages`
**Auth: Required**
**Roles: CUSTOMER(own), TECH/ADMIN(assigned / global)**

**Request Body**
```json
{
  "content": "Can you confirm your internet connection is working?"
}
```

**Response 201 Created:**
```json
{
  "ticketId": "ticket_c8d8e023b41a49cba8e24320592c696c",
  "messageTimestamp": "2026-01-05T20:25:10Z",
  "senderUserId": "tech_mike",
  "senderRole": "TECH",
  "content": "Can you confirm your internet connection is working?",
  "isSystem": false
}
```
## 6.3 Admin Endpoints
### 6.3.1 Create Group
**Method:** `POST`
**Route:** `/admin/groups`
**Auth: Required**
**Roles: ADMIN**

**Request Body**
```json
{
  "name": "Level 1 Support",
  "description": "Front-line IT support team"
}
```
**Response 201 Created**
```json
{
  "groupId": "group_level_1",
  "name": "Level 1 Support",
  "description": "Front-line IT support team",
  "createdAt": "2026-01-05T20:15:30Z",
  "updatedAt": "2026-01-05T20:15:30Z"
}
```

### 6.3.2 Create User
**Method:** `POST`
**Route:** `/admin/users`
**Auth: Required**
**Roles: ADMIN**

**Request Body:**
```json
{
  "userId": "tech_mike",
  "email": "mike.tech@example.com",
  "displayName": "Mike (Tech)",
  "role": "TECH",
  "groupIds": ["group_level_1"]
}
```

**Response 201 Created:**
```json
{
  "userId": "tech_mike",
  "email": "mike.tech@example.com",
  "displayName": "Mike (Tech)",
  "role": "TECH",
  "groupIds": ["group_level_1"],
  "createdAt": "2026-01-05T20:15:30Z",
  "updatedAt": "2026-01-05T20:15:30Z",
  "isActive": true
}
```
### 6.3.3 Assign Tickets
**Method:** `POST`
**Route:** `/admin/tickets/{ticketId}/assign`
**Auth: Required**
**Roles: ADMIN**

**Request Body:**
```json
{
  "assignedTechId": "tech_mike",
  "assignedGroupId": "group_level_1"
}
```

***Response 200 OK:*
```json
{
  "ticketId": "ticket_c8d8e023b41a49cba8e24320592c696c",
  "assignedTechId": "tech_mike",
  "assignedGroupId": "group_level_1",
  "updatedAt": "2026-01-05T21:30:00Z"
}
```
### 6.3.4 List Users
**Method:** `GET`
**Route:** `/admin/users`
**Auth: Required**
**Roles: ADMIN**

**Response 200 OK:**
```json
{
  "items": [
    {
      "userId": "customer_ashley",
      "email": "ashley@example.com",
      "displayName": "Ashley",
      "role": "CUSTOMER",
      "groupIds": [],
      "isActive": true,
      "createdAt": "2026-01-05T20:15:30Z",
      "updatedAt": "2026-01-05T20:15:30Z"
    }
  ]
}
```

### 6.3.5 List Groups
**Method:** `GET`
**Route:** `/admin/groups`
**Auth: Required**
**Roles: ADMIN**

**Response 200 OK:**
```json
{
  "items": [
    {
      "groupId": "group_level_1",
      "name": "Level 1 Support",
      "description": "Front-line IT support team",
      "createdAt": "2026-01-05T20:15:30Z",
      "updatedAt": "2026-01-05T20:15:30Z"
    }
  ]
}
```

### 6.3.6 List All Tikcets (Admin View)
**Method:** `GEt`
**Route:** `/admin/tickets`
**Auth: Required**
**Roles: ADMIN**

### Query Parameters (Optional):

status

priority

isEmergency

assignedGroupId

assignedTechId

limit

cursor

**Response 200 OK:**
```json
{
  "items": [
    {
      "ticketId": "ticket_c8d8e023b41a49cba8e24320592c696c",
      "title": "VPN not connecting",
      "status": "IN_PROGRESS",
      "priority": "CRITICAL",
      "isEmergency": "EMERGENCY",
      "isEmergencyBool": true,
      "createdByUserId": "customer_ashley",
      "assignedTechId": "tech_mike",
      "assignedGroupId": "group_level_1",
      "createdAt": "2026-01-05T20:15:30Z",
      "updatedAt": "2026-01-05T21:30:00Z"
    }
  ],
  "nextCursor": null
}
```

## 7. Error Handling

### 7.1 Error Response Shape 
**All non-2xx responses should follow this structure**

```json
{
  "errorCode": "INVALID_REQUEST",
  "message": "Priority must be one of: LOW, NORMAL, HIGH, CRITICAL.",
  "details": null,
  "requestId": "abc123-xyz"
}
```
### 7.2 Common Error Codes
| HTTP | errorCode       | Description                                    |
| ---- | --------------- | ---------------------------------------------- |
| 400  | INVALID_REQUEST | Validation errors, malformed JSON, bad fields  |
| 401  | UNAUTHENTICATED | Missing or invalid auth                        |
| 403  | FORBIDDEN       | User is authenticated but not allowed          |
| 404  | NOT_FOUND       | Resource not found / not visible               |
| 409  | CONFLICT        | Conflicting update or invalid state transition |
| 500  | INTERNAL_ERROR  | Unexpected server error                        |

---

## 8.Monitoring & Logging (API-Level)
All requests should log:

requestId

path

method

userId (if known)

statusCode

Error logs should include:

errorCode

stack trace (server-side only)

API Gateway and Lambda are wired to CloudWatch Logs and CloudWatch Metrics.

Alerting examples (future):

High rate of 5xx responses on any route

Spikes in emergency ticket creation

Abnormal drop in overall traffic

## 9.Future Enhancements

Full Cognito integration and JWT authorizer enforcement

Pagination & filtering on all list endpoints

File upload support on messages (screenshots, logs)

Soft delete / archival policies for old tickets & messages

Rate limiting & API keys for external integrations
