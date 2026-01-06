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

Request (JSON)

{
  "title": "Printer not working",
  "description": "The printer on floor 3 keeps jamming.",
  "priority": "HIGH",
  "isEmergency": false
}


Behavior

Creates a ticket for the current user (userId = "demo-user" for now).

Sets:

status = "IN_REVIEW"

createdAt / updatedAt to current time

isEmergency → "EMERGENCY" or "NORMAL" (string) for GSI

isEmergencyBool → true / false for app logic

Writes item to Tickets table.

Response — 201 Created

{
  "userId": "demo-user",
  "ticketId": "ticket_a0ea3ab190824f77b51461034f960138",
  "title": "Printer not working",
  "description": "The printer on floor 3 keeps jamming.",
  "status": "IN_REVIEW",
  "priority": "HIGH",
  "isEmergency": "NORMAL",
  "isEmergencyBool": false,
  "createdAt": "2026-01-06T09:17:23.924160Z",
  "updatedAt": "2026-01-06T09:17:23.924160Z"
}


Error responses

400 Bad Request — missing title or description

500 Internal Server Error — DynamoDB or other server error

1.1.2 List Tickets for Current User

Endpoint

GET /tickets


Behavior

Returns all tickets where userId = current user ("demo-user" for now).

Uses a DynamoDB Query on the Tickets table, keyed by userId.

Response — 200 OK

{
  "items": [
    {
      "userId": "demo-user",
      "ticketId": "ticket_a0ea3ab190824f77b51461034f960138",
      "title": "Whole office down",
      "description": "No network",
      "status": "IN_REVIEW",
      "priority": "CRITICAL",
      "isEmergency": "EMERGENCY",
      "isEmergencyBool": true,
      "createdAt": "2026-01-06T09:17:23.924160Z",
      "updatedAt": "2026-01-06T09:17:23.924160Z"
    }
  ]
}


Error responses

500 Internal Server Error — query failure

1.2 Ticket Messages (Chat)

Lambda: MessagesHandlerPython
Table: TicketMessages

Endpoints:

Method	Path	Description
GET	/tickets/{ticketId}/messages	List messages for a ticket
POST	/tickets/{ticketId}/messages	Add a new message to a ticket

Path parameters

ticketId — ID of the ticket the messages belong to

1.2.1 List Ticket Messages

Endpoint

GET /tickets/{ticketId}/messages


Behavior

Queries TicketMessages table with:

ticketId as partition key

Returns all messages ordered by timestamp.

Response — 200 OK

{
  "ticketId": "TEST123",
  "messages": [
    {
      "ticketId": "TEST123",
      "timestamp": "2026-01-06T08:49:40.448547Z",
      "messageId": "msg_a9e9fcc146f241738708d740629cde7d",
      "senderId": "demo-user",
      "senderRole": "customer",
      "messageText": "hello!",
      "isSystem": false
    }
  ]
}

1.2.2 Create Ticket Message

Endpoint

POST /tickets/{ticketId}/messages


Request (JSON)

{
  "messageText": "hello!",
  "senderId": "demo-user",
  "senderRole": "customer"
}


Behavior

Validates messageText is present.

Uses ticketId from the path.

Writes a new item to TicketMessages with:

ticketId (PK)

timestamp (SK)

messageId

senderId

senderRole

messageText

isSystem = false

Response — 201 Created

{
  "ticketId": "TEST123",
  "timestamp": "2026-01-06T08:49:40.448547Z",
  "messageId": "msg_a9e9fcc146f241738708d740629cde7d",
  "senderId": "demo-user",
  "senderRole": "customer",
  "messageText": "hello!",
  "isSystem": false
}


Error responses

400 Bad Request — missing messageText or invalid JSON

500 Internal Server Error — DynamoDB error

1.3 Emergency API

Lambda: EmergencyHandlerPython
Table: Tickets (same as normal tickets)
GSI: EmergencyTickets on isEmergency (partition key) and optionally createdAt (sort key)

Endpoints:

Method	Path	Description
POST	/emergency	Create an emergency ticket
GET	/admin/emergency-tickets	List emergency tickets
1.3.1 Create Emergency Ticket

Endpoint

POST /emergency


Request (JSON)

{
  "title": "Whole office down",
  "description": "No network",
  "priority": "CRITICAL"
}


Behavior

Creates a ticket similar to POST /tickets, but:

Forces isEmergency = "EMERGENCY"

Sets isEmergencyBool = true

Uses priority default "CRITICAL" if not provided

Response — 201 Created

{
  "userId": "demo-user",
  "ticketId": "ticket_a0ea3ab190824f77b51461034f960138",
  "title": "Whole office down",
  "description": "No network",
  "status": "IN_REVIEW",
  "priority": "CRITICAL",
  "isEmergency": "EMERGENCY",
  "isEmergencyBool": true,
  "createdAt": "2026-01-06T09:17:23.924160Z",
  "updatedAt": "2026-01-06T09:17:23.924160Z"
}

1.3.2 List Emergency Tickets

Endpoint

GET /admin/emergency-tickets


Behavior

Queries Tickets table using the EmergencyTickets GSI:

isEmergency = "EMERGENCY"

Response — 200 OK

{
  "items": [
    {
      "userId": "demo-user",
      "ticketId": "ticket_a0ea3ab190824f77b51461034f960138",
      "title": "Whole office down",
      "description": "No network",
      "status": "IN_REVIEW",
      "priority": "CRITICAL",
      "isEmergency": "EMERGENCY",
      "isEmergencyBool": true,
      "createdAt": "2026-01-06T09:17:23.924160Z",
      "updatedAt": "2026-01-06T09:17:23.924160Z"
    }
  ]
}

1.4 Admin & Org Management

Lambda: AdminHandlerPython
Tables: Users, Groups, Tickets

Endpoints:

Method	Path	Description
POST	/admin/groups	Create or update a group
POST	/admin/users	Create or update a user
POST	/admin/tickets/{ticketId}/assign	Assign/reassign a ticket
1.4.1 Create/Update Group

Endpoint

POST /admin/groups


Request (JSON)

{
  "groupId": "group_austin",
  "groupName": "Austin IT",
  "description": "Austin onsite team"
}


Behavior

Upserts a record into Groups table:

groupId (PK)

groupName

description

createdAt (current time)

Response — 201 Created

{
  "groupId": "group_austin",
  "groupName": "Austin IT",
  "description": "Austin onsite team",
  "createdAt": "2026-01-06T09:23:34.289634Z"
}

1.4.2 Create/Update User

Endpoint

POST /admin/users


Request (JSON)

{
  "userId": "tech_john",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "tech",
  "groupId": "group_austin"
}


Behavior

Upserts a record into Users table:

userId (PK)

name

email

role (e.g., "customer", "tech", "admin")

groupId (optional)

createdAt

Response — 201 Created

{
  "userId": "tech_john",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "tech",
  "groupId": "group_austin",
  "createdAt": "2026-01-06T09:30:00.000000Z"
}

1.4.3 Assign Ticket

Endpoint

POST /admin/tickets/{ticketId}/assign


Request (JSON)

{
  "assignedTo": "tech_john",
  "groupId": "group_austin",
  "status": "ASSIGNED"
}


Behavior

Updates the ticket in Tickets table:

Sets assignedTo

Sets groupId (if provided)

Sets status (default "ASSIGNED" if omitted)

Currently assumes userId = "demo-user" for the partition key; in a real multi-tenant setup, ticket lookup would use the correct userId from auth context.

Response — 200 OK

{
  "ticketId": "ticket_a0ea3ab190824f77b51461034f960138",
  "assignedTo": "tech_john",
  "groupId": "group_austin",
  "status": "ASSIGNED"
}

2. Authentication & Authorization (Future)

Integrate with Amazon Cognito to supply:

userId

role (customer, tech, admin)

Enforce role-based access as defined in security-model.md.

Replace hard-coded "demo-user" with values from JWT claims/auth context.

3. Logging & Retention

All requests and errors are logged via CloudWatch Logs for each Lambda function.

Ticket, message, and admin actions are persisted in DynamoDB tables.

As defined in the data retention policy, operational logs and records are archived and/or deleted after 6–18 months depending on type and business requirements.


If you paste that over your existing `api-design.md`, it’ll line up with what you’ve actually built, and it gives you a clean contract to point to when you start building the admin dashboard and frontend calls.
::contentReference[oaicite:0]{index=0}
