# Database Schema — DynamoDB Design

This document describes the DynamoDB data model for **TheWinningTeam IT Services Platform**.

The goal is to support:

- Customer ticket creation & tracking
- Technician/admin assignment and management
- Emergency escalation workflows
- Ticket-bound messaging (chat)
- Audit logging with 6–18 month retention

DynamoDB is chosen for its serverless, low-ops, and highly scalable nature when paired with AWS Lambda and API Gateway.

---

## 1. Design Principles

- **Access-pattern first:** Tables are designed around how the app will query data, not just how it looks logically.
- **No joins:** Related data is grouped using partition/sort keys and secondary indexes.
- **Event/history friendly:** Messages and logs are modeled as time-ordered records.
- **Retention-aware:** Ticket and audit data is designed to be archived/deleted after 6–18 months.

---

## 2. Tables Overview

| Table Name       | Purpose                                              |
|------------------|------------------------------------------------------|
| `Users`          | Stores customers, technicians, and admins            |
| `Groups`         | Organizational units / domains / teams               |
| `Tickets`        | Core ticket entities per user                        |
| `TicketMessages` | Per-ticket chat messages                             |
| `AuditLogs`      | System and ticket event logs                         |

In addition, the `Tickets` table uses **Global Secondary Indexes (GSIs)** for:

- Technician queues
- Emergency ticket queue

---

## 3. `Users` Table

### 3.1 Purpose

Holds all users of the platform, including:

- Customers (end users)
- Technicians
- Admins

### 3.2 Key Schema

- **Partition Key (PK):** `userId` (string)
- No Sort Key.

Each user has a unique `userId`.

### 3.3 Attributes (Example Set)

- `userId` *(string, PK)*
- `name` *(string)*
- `email` *(string)*
- `role` *(string: "customer" | "tech" | "admin")*
- `groupId` *(string, FK to Groups.groupId — optional)*
- `createdAt` *(ISO timestamp string)*

> Additional attributes can be added as needed (e.g., phone number, preferences).

### 3.4 Sample Item

```json
{
  "userId": "user_123",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "customer",
  "groupId": "group_austin",
  "createdAt": "2026-01-05T18:10:00Z"
}

