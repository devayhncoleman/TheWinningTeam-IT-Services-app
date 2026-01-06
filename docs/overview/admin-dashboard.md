# Admin Dashboard — TheWinningTeam IT Services Platform

This document describes the **Admin Dashboard** for TheWinningTeam.  
It maps **screens → user actions → API calls → DynamoDB data.**

The dashboard is used by **admins and technicians** to:

- Monitor tickets
- Handle emergencies
- Manage users and groups
- Assign tickets and follow up

> Note: Authentication/roles will be added later. For now, the backend uses `userId = "demo-user"` as a placeholder.

---

## 1. Information Architecture (Pages)

The Admin Dashboard consists of these main areas:

1. **Dashboard Home**
2. **Tickets**
   - Ticket list
   - Ticket detail (with messages)
3. **Emergency Queue**
4. **Users**
5. **Groups**
6. **(Future) Settings / Audit**

Each page below defines:

- Purpose
- UI elements
- API calls (current + future)
- Data involved

---

## 2. Dashboard Home

### 2.1 Purpose

Give a **high-level overview** of system status:

- How many tickets are open / assigned / resolved  
- Whether any emergency tickets exist  
- Quick links to core pages

### 2.2 UI Elements

- **KPI Cards**
  - Total tickets (for now: tickets owned by `demo-user`)
  - Open vs resolved tickets
  - Count of emergency tickets

- **Emergency Banner**
  - If `emergencyCount > 0` show a prominent alert:
    - “⚠ X Emergency Tickets”

- **Quick Links**
  - “View All Tickets”
  - “Emergency Queue”
  - “Manage Users”
  - “Manage Groups”

### 2.3 API Calls

**Current backend capabilities:**

- `GET /tickets`  
  - Returns all tickets for current user (`demo-user` now)
- `GET /admin/emergency-tickets`  
  - Returns all emergency tickets

**Usage:**

- On page load:
  - Call `GET /tickets`
  - Call `GET /admin/emergency-tickets`
- Compute counts client-side:
  - Total tickets
  - By `status`
  - Number of emergency tickets

> Future: `GET /admin/tickets` to list all tickets across users instead of a single user.

---

## 3. Tickets Page

The Tickets section has two main views:

1. **Ticket List** (table)
2. **Ticket Detail View** (panel/drawer/page)

### 3.1 Ticket List View

#### 3.1.1 Purpose

Show tickets in a **filterable table** so admins/techs can quickly find and manage tickets.

#### 3.1.2 UI Elements

- **Filters**
  - Status: `IN_REVIEW`, `ASSIGNED`, `RESOLVED`, `CLOSED`
  - Priority: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - Emergency: emergency-only toggle (uses emergency info, or reuses emergency endpoint)
- **Ticket Table Columns**
  - `ticketId`
  - `title`
  - `status`
  - `priority`
  - `isEmergency`
  - `assignedTo`
  - `groupId`
  - `createdAt`
- **Row actions**
  - Click row → open Ticket Detail

#### 3.1.3 API Calls

**Current:**

- `GET /tickets`  
  - Lists tickets for `demo-user`

**Usage:**

- On page load:
  - Call `GET /tickets`
  - Store in state and allow filtering on the frontend

> Future:  
> - `GET /admin/tickets` → all tickets  
> - `GET /tickets?status=IN_REVIEW` (or equivalent filtering API)

---

### 3.2 Ticket Detail View

#### 3.2.1 Purpose

Display all important information for a single ticket and allow:

- Assignment / reassignment
- Status updates
- Viewing and sending messages

#### 3.2.2 UI Elements

- **Ticket header**
  - `ticketId`
  - `title`
  - Emergency badge (if `isEmergency == "EMERGENCY"`)

- **Ticket details section**
  - `description`
  - `status` (dropdown)
  - `priority`
  - `assignedTo` (select from list of users)
  - `groupId` (select from list of groups)
  - `createdAt` / `updatedAt`

- **Messages panel**
  - Messages list (chat history)
  - Text box + Send button to post new messages

#### 3.2.3 API Calls

**Existing endpoints used here:**

- For ticket list context:
  - `GET /tickets`  
    - Used to get the ticket’s base data (until `GET /tickets/{ticketId}` exists).

- For messages:
  - `GET /tickets/{ticketId}/messages`
  - `POST /tickets/{ticketId}/messages`

- For assignment:
  - `POST /admin/tickets/{ticketId}/assign`

**Typical flow:**

1. User clicks a ticket row in the list.
2. Frontend:
   - Retrieves the ticket object from local state (from `GET /tickets`).
   - Calls `GET /tickets/{ticketId}/messages` to load chat.
3. When user sends a message:
   - `POST /tickets/{ticketId}/messages`
4. When admin updates assignment or status:
   - `POST /admin/tickets/{ticketId}/assign`

**Assign API — Example request:**

```json
{
  "assignedTo": "tech_john",
  "groupId": "group_austin",
  "status": "ASSIGNED"
}

4. Emergency Queue Page
4.1 Purpose

Provide a focused view of emergency tickets so admins/techs can handle urgent issues fast.

4.2 UI Elements

Emergency ticket table

Similar columns to Tickets list:

ticketId, title, priority, status, assignedTo, createdAt

Highlighting

Emphasize CRITICAL priority and IN_REVIEW status

Row actions

Click row → open Ticket Detail (same component as Tickets page)

4.3 API Calls

GET /admin/emergency-tickets

Backend behavior:

Uses the EmergencyTickets GSI on Tickets table:

isEmergency = "EMERGENCY"

Usage:

On page load:

Call GET /admin/emergency-tickets

Optionally, auto-refresh every X seconds/minutes in the future.

5. Users Page
5.1 Purpose

Let admins create and manage users:

Techs

Admins

(Optionally) customers

5.2 UI Elements

User table

Columns:

userId

name

email

role

groupId

Form for create/update

Fields:

userId

name

email

role (customer, tech, admin)

groupId (dropdown from Groups table)

Right now the backend only implements create/update via POST /admin/users.
Listing all users would require a new GET /admin/users endpoint (future).

5.3 API Calls

Create/update user:

POST /admin/users

Example request:
{
  "userId": "tech_john",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "tech",
  "groupId": "group_austin"
}
Current limitation:

No GET /admin/users yet.

For now, user list can be:

Hardcoded in frontend, or

Seeded/configured backend-side, or

Temporary manual management via direct DynamoDB edits.

6. Groups Page
6.1 Purpose

Let admins define and manage groups/teams (e.g., “Austin IT”, “Night Shift”).

6.2 UI Elements

Groups table

groupId

groupName

description

Form for create/update

groupId

groupName

description

6.3 API Calls

Create/update group:

POST /admin/groups

Example request:
{
  "groupId": "group_austin",
  "groupName": "Austin IT",
  "description": "Austin onsite team"
}

Current limitation:

No GET /admin/groups endpoint yet.

Similar to users, listing may be:

Hardcoded for now, or

Managed in DynamoDB directly until a read endpoint is implemented.

7. Role Mapping (Future Auth)

Once authentication is in place, the Admin Dashboard will behave differently per role:

Role	Views
admin	Full dashboard (all pages)
tech	Tickets, Emergency Queue, limited Users/Groups view
customer	Not using this dashboard, but a separate customer-facing UI

Role info will come from auth (e.g., JWT claims), and the frontend will:

Show/hide navigation items based on role

Restrict which actions are enabled (e.g., only admin sees “Assign ticket”)

8. File Location & Cross-References

File location:
docs/
  overview/
    admin-dashboard.md   <-- this document
