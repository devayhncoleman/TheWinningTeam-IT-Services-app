Security & Authentication Model

Version: 1.0
Owner: Team A – The Winning Team
Last Updated: 2026-01-06

1. Purpose

This document defines how authentication and authorization work in the IT Services Platform.

The goals are:

Real user accounts

Secure login & identity

Role-based access control (RBAC)

Hybrid support for demo/testing

Minimal friction for development

Clean migration path to full auth enforcement

2. Identity & Authentication Overview

The platform uses Amazon Cognito User Pools for:

signup

login

password management

token generation (JWT)

Clients authenticate using:

Authorization: Bearer {JWT_ACCESS_TOKEN}

The backend validates this token via API Gateway JWT Authorizer.

3. Supported User Roles
| Role     | Description                                                          |
| -------- | -------------------------------------------------------------------- |
| CUSTOMER | End users who create and track tickets                               |
| TECH     | Support technicians who work assigned tickets                        |
| ADMIN    | Platform administrators who manage users, groups, and ticket routing |

Roles are stored as a custom Cognito attribute:

custom:role = CUSTOMER | TECH | ADMIN

4. Hybrid Auth Strategy (Development → Production)
4.1 Current Behavior (Development Mode)

Identity is resolved in this order:

Cognito JWT token (if present)

x-user-id header

fallback: demo-user

This allows:

real login when available

header override during development

demo-only environments

4.2 Target Behavior (Production Mode)

Eventually:

JWT required for protected routes

Demo header only available in dev environments

No anonymous access for sensitive actions

5. Cognito Configuration
5.1 Create User Pool

Configuration:

Enable username + email login

Enable email verification

Allow self-service or admin-created users

Enable hosted UI (optional future UI feature)

5.2 Custom Attributes

Add attribute:

Name: custom:role
Type: String
Allowed values: CUSTOMER, TECH, ADMIN

Assigned on user creation.

6. Authorization Rules

Authorization is role-based.

| Endpoint               | CUSTOMER   | TECH               | ADMIN |
| ---------------------- | ---------- | ------------------ | ----- |
| /tickets (POST)        | ✅          | ✅                  | ✅     |
| /tickets (GET)         | ✅ own only | ✅ assigned / group | ✅ all |
| /tickets/{id}          | ✅ own only | ✅ assigned / group | ✅ all |
| /tickets/{id} (PATCH)  | ❌          | ✅                  | ✅     |
| /tickets/{id}/messages | ✅ own      | ✅ assigned         | ✅ all |
| /admin/*               | ❌          | ❌                  | ✅     |

7. Backend User Context

The function:

get_current_user()

Resolves:

userId

role

auth source

Priority:

JWT → extract sub + role

header x-user-id (dev only)

fallback demo user

This allows gradual rollout without breaking current workflows.

8. Migration Plan
Phase 1 — Hybrid (Current)

JWT optional

headers still allowed

fallback demo enabled

Phase 2 — Partial Enforcement

Protect admin routes first

Protect ticket create/read/write next

Phase 3 — Full Enforcement (Future)

All routes require JWT

Demo routes isolated or removed

9. Security Considerations

No secrets stored in client code

No plaintext passwords

JWT token expiration enforced

Logs never store passwords

PII is minimized

Role checks are server-side only

10. Logging & Monitoring (Auth)

Track:

login success/failure

unauthorized attempts

token validation failures

suspicious activity indicators

