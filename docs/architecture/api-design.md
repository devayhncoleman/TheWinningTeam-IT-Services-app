✅ TheWinningTeam — API Design

This document defines the HTTP API for TheWinningTeam, an IT services platform built on:

Amazon API Gateway (HTTP API)

AWS Lambda (Python)

Amazon DynamoDB

All responses are JSON.
Timestamps use ISO 8601 (YYYY-MM-DDTHH:MM:SSZ).

Note

Authentication will be added later (ex: Amazon Cognito).

For now:
userId = "demo-user" is hard-coded.

0. Overview

0.1 Resource Areas
| Area            | Purpose                       | Status          |
| --------------- | ----------------------------- | --------------- |
| Tickets         | Create + view support tickets | **Implemented** |
| Ticket Messages | Chat inside a ticket          | **Implemented** |
| Emergency       | Escalation workflow           | **Implemented** |
| Admin           | Users / groups / assignment   | **Implemented** |
| Auth            | JWT / roles                   | Planned         |

1. Tickets API

Lambda: TicketsHandlerPython
Table: Tickets

1.1 Create Ticket
POST /tickets

Request Body

{
  "title": "Printer not working",
  "description": "The printer jams constantly.",
  "priority": "HIGH",
  "isEmergency": false
}

Behavior

Creates a new ticket for the current user

Fields set automatically:

ticketId

status = "IN_REVIEW"

createdAt

updatedAt

isEmergency = "NORMAL" | "EMERGENCY"

isEmergencyBool = true | false

Success — 201
{
  "userId": "demo-user",
  "ticketId": "ticket_abc123",
  "title": "Printer not working",
  "description": "The printer jams constantly.",
  "status": "IN_REVIEW",
  "priority": "HIGH",
  "isEmergency": "NORMAL",
  "isEmergencyBool": false,
  "createdAt": "2026-01-06T09:17:23.924160Z",
  "updatedAt": "2026-01-06T09:17:23.924160Z"
}

Errors (Possible)
| Code | Meaning                 |
| ---- | ----------------------- |
| 400  | Missing required fields |
| 500  | Server / DB error       |

1.2 List User Tickets
GET /tickets

Behavior

Returns all tickets for current user.Behavior

Returns all tickets for current user.
Success — 200
{
  "items": [
    {
      "userId": "demo-user",
      "ticketId": "ticket_abc123",
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

| Method | Path                  | Purpose               |
| ------ | --------------------- | --------------------- |
| GET    | `/tickets/{ticketId}` | View a single ticket  |
| PATCH  | `/tickets/{ticketId}` | Update status/details |

2. Ticket Messages (Chat)

Lambda: MessagesHandlerPython
Table: TicketMessages

| Method | Path                           | Purpose       |
| ------ | ------------------------------ | ------------- |
| GET    | `/tickets/{ticketId}/messages` | List messages |
| POST   | `/tickets/{ticketId}/messages` | Add message   |

2.1 List Messages
GET /tickets/{ticketId}/messages

Success — 200
{
  "ticketId": "TEST123",
  "messages": [
    {
      "ticketId": "TEST123",
      "timestamp": "2026-01-06T08:49:40.448547Z",
      "messageId": "msg_123",
      "senderId": "demo-user",
      "senderRole": "customer",
      "messageText": "hello!",
      "isSystem": false
    }
  ]
}

2.2 Create Message
POST /tickets/{ticketId}/messages

Request Body
{
  "messageText": "hello!",
  "senderId": "demo-user",
  "senderRole": "customer"
}

Success — 201
{
  "ticketId": "TEST123",
  "timestamp": "2026-01-06T08:49:40.448547Z",
  "messageId": "msg_123",
  "senderId": "demo-user",
  "senderRole": "customer",
  "messageText": "hello!",
  "isSystem": false
}

Errors (Possible)
| Code | Meaning               |
| ---- | --------------------- |
| 400  | Missing `messageText` |
| 500  | DB error              |

3. Emergency API
Lambda: EmergencyHandlerPython
Table: Tickets
GSI: EmergencyTickets

| Method | Path                       | Purpose                 |
| ------ | -------------------------- | ----------------------- |
| POST   | `/emergency`               | Create emergency ticket |
| GET    | `/admin/emergency-tickets` | List emergency tickets  |

3.1 Create Emergency Ticket
POST /emergency
{
  "title": "Whole office down",
  "description": "No network",
  "priority": "CRITICAL"
}

Behavior

Forces isEmergency = "EMERGENCY"

Success — 201
{
  "ticketId": "ticket_abc123",
  "priority": "CRITICAL",
  "isEmergency": "EMERGENCY",
  "isEmergencyBool": true
}

3.2 List Emergency Tickets

GET /admin/emergency-tickets

Success — 200
{
  "items": [
    {
      "ticketId": "ticket_abc123",
      "priority": "CRITICAL",
      "isEmergency": "EMERGENCY"
    }
  ]
}

4. Admin API
Lambda: AdminHandlerPython

| Method | Path                               | Purpose             |
| ------ | ---------------------------------- | ------------------- |
| POST   | `/admin/groups`                    | Create/update group |
| POST   | `/admin/users`                     | Create/update user  |
| POST   | `/admin/tickets/{ticketId}/assign` | Assign ticket       |

4.1 Create/Update Group
POST /admin/groups

Request Body
{
  "groupId": "group_austin",
  "groupName": "Austin IT",
  "description": "Austin onsite team"
}

Success — 201
{
  "groupId": "group_austin",
  "groupName": "Austin IT",
  "description": "Austin onsite team",
  "createdAt": "2026-01-06T09:23:34.289634Z"
}

4.2 Create/Update User
POST /admin/users

Request Body
{
  "userId": "tech_john",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "tech",
  "groupId": "group_austin"
}

Success — 201
{
  "userId": "tech_john",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "tech",
  "groupId": "group_austin"
}

4.3 Assign Ticket
POST /admin/tickets/{ticketId}/assign

Request Body
{
  "assignedTo": "tech_john",
  "groupId": "group_austin",
  "status": "ASSIGNED"
}

Success — 200
{
  "ticketId": "ticket_abc123",
  "assignedTo": "tech_john",
  "groupId": "group_austin",
  "status": "ASSIGNED"
}

5. Authentication (Planned)

Amazon Cognito user pool

JWT in Authorization header

Roles:

customer

tech

admin

6. Logging & Retention

CloudWatch Logs for all Lambdas

DynamoDB stores:

Tickets

Messages

Admin records

Logs retained 6–18 months****
