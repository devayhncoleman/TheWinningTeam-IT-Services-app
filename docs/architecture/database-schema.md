✅ Database Schema — DynamoDB Design

This document describes the DynamoDB data model for the TheWinningTeam IT Services Platform.

The database supports:

Ticket creation & tracking

Ticket-bound messaging (chat)

Technician assignment

Emergency escalation

Lightweight user & group management

DynamoDB is used for a serverless, low-maintenance backend paired with AWS Lambda & API Gateway.

1. Design Principles

Access-pattern first — tables are modeled around API needs

Low coupling — users, tickets, and messages are separate

Time-ordered history — messages sorted by timestamp

Tenant isolation via userId (for now: hard-coded "demo-user")

Retention-aware — easy to expire/archive records after 6–18 months

2. Tables Overview (Current State)
| Table                           | Purpose                         |
| ------------------------------- | ------------------------------- |
| `Users`                         | Stores customers, techs, admins |
| `Groups`                        | Defines teams/org units         |
| `Tickets`                       | Core ticket records             |
| `TicketMessages`                | Chat messages per-ticket        |
| *(optional future)* `AuditLogs` | System history / auditing       |

3. Users Table
3.1 Purpose

Stores all user accounts:

customers

techs

admins

3.2 Key Schema
| Key      | Type                       |
| -------- | -------------------------- |
| `userId` | **Partition key (String)** |

Users are uniquely identified by userId.

3.3 Attributes

userId (PK, string)

name (string)

email (string)

role (string — "customer", "tech", "admin")

groupId (string, optional — references Groups.groupId)

createdAt (ISO timestamp)

3.4 Sample Item
{
  "userId": "tech_john",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "tech",
  "groupId": "group_austin",
  "createdAt": "2026-01-06T09:30:00Z"
}

4. Groups Table
4.1 Purpose

Defines technician teams / organizational groups.

4.2 Key Schema
| Key       | Type                       |
| --------- | -------------------------- |
| `groupId` | **Partition key (String)** |

4.3 Attributes

groupId (PK)

groupName

description

createdAt

4.4 Sample Item
{
  "groupId": "group_austin",
  "groupName": "Austin IT",
  "description": "Austin onsite team",
  "createdAt": "2026-01-06T09:23:34Z"
}

5. Tickets Table
5.1 Purpose

Stores all IT support tickets.

5.2 Key Schema
| Key        | Type                       |
| ---------- | -------------------------- |
| `userId`   | **Partition key (String)** |
| `ticketId` | **Sort key (String)**      |

This means:

All tickets created by a user are grouped under that userId

(Currently userId = "demo-user".)

5.3 Core Attributes
| Field             | Type              | Notes                                                 |
| ----------------- | ----------------- | ----------------------------------------------------- |
| `userId`          | string            | PK                                                    |
| `ticketId`        | string            | SK                                                    |
| `title`           | string            |                                                       |
| `description`     | string            |                                                       |
| `status`          | string            | `"IN_REVIEW"`, `"ASSIGNED"`, `"RESOLVED"`, `"CLOSED"` |
| `priority`        | string            | `"LOW"`, `"MEDIUM"`, `"HIGH"`, `"CRITICAL"`           |
| `assignedTo`      | string (optional) | tech userId                                           |
| `groupId`         | string (optional) | group assignment                                      |
| `isEmergency`     | string            | `"EMERGENCY"` or `"NORMAL"` *(used by GSI)*           |
| `isEmergencyBool` | bool              | convenience field                                     |
| `createdAt`       | ISO timestamp     |                                                       |
| `updatedAt`       | ISO timestamp     |                                                       |

5.4 Global Secondary Indexes (GSIs)

5.4.1 Emergency Tickets Queue
| Setting                 | Value                    |
| ----------------------- | ------------------------ |
| **Index Name**          | `EmergencyTickets`       |
| **Partition Key**       | `isEmergency` *(String)* |
| **(Optional Sort Key)** | `createdAt`              |

Queries like:
isEmergency = "EMERGENCY"
-> returns all emergency tickets.

(Future optional — not yet implemented)

Technician Ticket Queue GSI

Example (future):
PK = assignedTo

5.5 Sample Item
{
  "userId": "demo-user",
  "ticketId": "ticket_abc123",
  "title": "Whole office down",
  "description": "No network",
  "status": "IN_REVIEW",
  "priority": "CRITICAL",
  "assignedTo": "tech_john",
  "groupId": "group_austin",
  "isEmergency": "EMERGENCY",
  "isEmergencyBool": true,
  "createdAt": "2026-01-06T09:17:23Z",
  "updatedAt": "2026-01-06T09:17:23Z"
}

6. TicketMessages Table
6.1 Purpose

Stores chat messages associated with tickets.

6.2 Key Schema
| Key         | Type                       |
| ----------- | -------------------------- |
| `ticketId`  | **Partition key (String)** |
| `timestamp` | **Sort key (String)**      |

This allows:

Efficient chat history retrieval

Messages sorted by time

6.3 Attributes

ticketId

timestamp

messageId

senderId

senderRole ("customer", "tech", "admin")

messageText

isSystem (bool)

6.4 Sample Item
{
  "ticketId": "ticket_abc123",
  "timestamp": "2026-01-06T08:49:40Z",
  "messageId": "msg_123",
  "senderId": "demo-user",
  "senderRole": "customer",
  "messageText": "hello!",
  "isSystem": false
}

7. AuditLogs Table (Planned)
placeholder for system event history.

8. Data Retention Strategy

DynamoDB tables store primary operational data

Items may be:

Archived to S3

Deleted after 6–18 months

Retention policy documented separately in
docs/product/data-retention-policy.md

9. Alignment With Current API

✔ Fully supports:

POST /tickets

GET /tickets

POST /tickets/{ticketId}/messages

GET /tickets/{ticketId}/messages

POST /emergency

GET /admin/emergency-tickets

POST /admin/groups

POST /admin/users

POST /admin/tickets/{ticketId}/assign

✔ Matches current Lambda behavior
✔ Matches GSI usage
✔ Matches data shapes returned to clients
