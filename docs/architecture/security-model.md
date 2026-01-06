# Security Model — TheWinningTeam IT Services Platform

This document describes the security model for **TheWinningTeam**, focusing on:

- Application roles and permissions
- API access control per role
- Data access patterns and tenant isolation
- AWS IAM roles and policies for backend components
- Logging, auditing, and retention

The design assumes AWS-native services:

- Amazon API Gateway
- AWS Lambda
- Amazon DynamoDB
- (Future) Amazon Cognito for authentication

---

## 1. Application Roles

The platform defines three primary application roles:

### 1.1 Customer

- End-user of IT services (small business or individual).
- Can:
  - Submit tickets
  - View their own tickets
  - Exchange messages with assigned technician while ticket is open
- Cannot:
  - View or modify other users’ tickets
  - Administer users, groups, or assignments

### 1.2 Technician

- Handles assigned tickets and interacts with customers.
- Can:
  - View tickets assigned to them (and optionally their group)
  - Update ticket status and internal notes
  - Send messages in ticket chats
  - View emergency queue relevant to their scope
- Cannot:
  - Arbitrarily view all historical tickets across all customers (unless policy allows)
  - Manage users or groups at a platform-wide level

### 1.3 Admin

- Platform/IT owner (you) and top-level operators.
- Can:
  - View all tickets
  - Manage groups/domains
  - Add/update users and roles
  - Assign and reassign tickets
  - View system-wide emergency queue
  - Access audit logs

---

## 2. Authentication & Identity

### 2.1 Current State (Demo / Initial Build)

For early development and demos:

- No real auth provider is wired yet.
- `userId` is hard-coded to `"demo-user"` in the Lambda for ticket creation.
- Role evaluation is not enforced at the API level yet.

> This is acceptable only for local testing, class demos, and non-production environments.

### 2.2 Target State (Future)

Use **Amazon Cognito** or another identity provider:

- Cognito User Pool for:
  - Customer accounts
  - Technician accounts
  - Admin accounts
- Roles signaled via:
  - JWT claims (e.g., `custom:role = "customer" | "tech" | "admin"`)
- API Gateway authorizer:
  - Validates JWT
  - Passes user identity and role into the Lambda event under `requestContext.authorizer.claims`.

**Lambda responsibility:**

- Extract `userId` and `role` from auth context.
- Enforce role-based access at the business logic layer.

---

## 3. Authorization — Role vs Endpoint

This section defines which role can call which endpoint and what they can do.

### 3.1 Tickets API

| Endpoint                         | Customer        | Technician       | Admin            |
|----------------------------------|-----------------|------------------|------------------|
| `POST /tickets`                  | ✅ create own   | (Not typical)    | ✅ create on behalf (optional) |
| `GET /tickets`                   | ✅ list own     | ✅ list assigned (future filter) | ✅ list all / filtered |
| `GET /tickets/{ticketId}`        | ✅ if owner     | ✅ if assigned or in group | ✅ any ticket |
| `PATCH /tickets/{ticketId}`      | ❌ no           | ✅ update assigned tickets | ✅ update any ticket |

**Key enforcement rules:**

- **Customer**:
  - `GET /tickets` → Query by `userId = caller.userId`.
  - `GET /tickets/{ticketId}` → Check `ticket.userId == caller.userId`.
  - `PATCH` → always denied.

- **Technician**:
  - `GET /tickets` (future): default view = assigned tickets via `assignedTo = caller.userId` GSI.
  - `GET /tickets/{ticketId}` → allowed if `ticket.assignedTo == caller.userId` or within same `groupId`.
  - `PATCH` allowed when technician is assigned to the ticket.

- **Admin**:
  - Full read/write access to tickets.

---

### 3.2 Ticket Messages (Chat) API

| Endpoint                                      | Customer        | Technician       | Admin            |
|-----------------------------------------------|-----------------|------------------|------------------|
| `GET /tickets/{ticketId}/messages`            | ✅ if owner     | ✅ if assigned   | ✅ any ticket    |
| `POST /tickets/{ticketId}/messages`           | ✅ if owner & ticket open | ✅ if assigned & ticket open | ✅ any (for interventions) |

**Additional constraints:**

- No new messages allowed once `ticket.status` is in `["RESOLVED", "CLOSED"]`.
- Messages should always be stored with:
  - `ticketId`
  - `senderId`
  - `senderRole`
  - `timestamp`

---

### 3.3 Emergency API

| Endpoint                             | Customer        | Technician       | Admin            |
|--------------------------------------|-----------------|------------------|------------------|
| `POST /emergency`                    | ✅ allowed      | ✅ allowed       | ✅ allowed       |
| `GET /admin/emergency-tickets`       | ❌ no           | ✅ view relevant tickets | ✅ view all emergency tickets |

**Notes:**

- `POST /emergency` either:
  - creates a new ticket with `isEmergency = "EMERGENCY"`, or
  - flags an existing ticket as `isEmergency = "EMERGENCY"`.
- `GET /admin/emergency-tickets` queries the `EmergencyTickets` GSI.

---

### 3.4 Admin & Org Management API

| Endpoint                                    | Customer | Technician | Admin |
|---------------------------------------------|----------|-----------|-------|
| `POST /admin/groups`                        | ❌       | ❌        | ✅ create/update groups |
| `POST /admin/users`                         | ❌       | ❌        | ✅ create/update users & roles |
| `POST /admin/tickets/{ticketId}/assign`     | ❌       | ❌ (or limited) | ✅ full assignment control |

Technicians **may** be allowed limited reassignment in the future (e.g., within their group), but by default this is an admin-only capability.

---

## 4. Data Access & Tenant Isolation

The main isolation boundary is `userId`:

- Customers can only see and manipulate items in DynamoDB where:
  - `ticket.userId == caller.userId`
  - `message.ticketId` belongs to a ticket they own
- Technicians see:
  - Only tickets where `assignedTo == caller.userId` (via GSI), or
  - Tickets in their `groupId` (if allowed by policy)
- Admins can see:
  - Any ticket and associated messages

This logic is enforced:

1. At the **Lambda level** (business rules)
2. Potentially at the **DynamoDB query level** by scoping keys and queries appropriately

No client-side enforcement should be trusted alone.

---

## 5. AWS IAM Roles and Policies

IAM controls what AWS resources each Lambda function can call.

### 5.1 Lambda Execution Roles

At minimum, plan for these roles:

- **`TheWinningTeam-TicketsLambdaRole`**
  - Attached to `TicketsHandlerPython` (and any future Tickets-related Lambdas).
  - Permissions:
    - `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:Query`, `dynamodb:UpdateItem`
      - Scoped to `Tickets` table and, if needed, `TicketsByTechnician` and `EmergencyTickets` GSIs.
    - `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` (via `AWSLambdaBasicExecutionRole`).

- **`TheWinningTeam-MessagesLambdaRole`**
  - Attached to Messages Lambda.
  - Permissions:
    - `dynamodb:PutItem`, `dynamodb:Query`
      - Scoped to `TicketMessages` table.
    - Log permissions as above.

- **`TheWinningTeam-AdminLambdaRole`**
  - Attached to Admin Lambda.
  - Permissions:
    - `dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:GetItem`, `dynamodb:Query`, `dynamodb:Scan`
      - Scoped to `Users`, `Groups`, and `Tickets` (including indexes).
    - Log permissions.

- **`TheWinningTeam-EmergencyLambdaRole`**
  - Attached to Emergency Lambda.
  - Permissions:
    - `dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:Query`
      - Scoped to `Tickets` table and emergency GSI.
    - Log permissions.

Each IAM role should use **least privilege**:  
only the specific tables and actions required by that Lambda.

---

### 5.2 Example IAM Policy Snippet (Tickets Lambda → Tickets Table Only)

Example of a minimal DynamoDB access policy (conceptually):

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:PutItem",
    "dynamodb:GetItem",
    "dynamodb:Query",
    "dynamodb:UpdateItem"
  ],
  "Resource": [
    "arn:aws:dynamodb:<region>:<account-id>:table/Tickets",
    "arn:aws:dynamodb:<region>:<account-id>:table/Tickets/index/EmergencyTickets",
    "arn:aws:dynamodb:<region>:<account-id>:table/Tickets/index/TicketsByTechnician"
  ]
}

