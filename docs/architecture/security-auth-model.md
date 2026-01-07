# Security & Authentication Model

Version: 2.0  
Owner: Team A – The Winning Team  
Last Updated: 2026-01-06

---

## 1. Purpose

This document defines how authentication and authorization are implemented for the IT Services Platform.

It covers:

- Identity sources
- Cognito configuration
- How JWTs are used
- Role-based access control (RBAC)
- Migration from header-based dev auth to full Cognito

---

## 2. Key Terms

- **JWT (JSON Web Token)**  
  Signed token issued by Cognito after login. Contains user claims (id, email, role).

- **RBAC (Role-Based Access Control)**  
  Permissions are tied to roles (CUSTOMER, TECH, ADMIN), not individual users.

- **MVP (Minimum Viable Product)**  
  Smallest working version that demonstrates real functionality end-to-end.

---

## 3. Roles

Supported roles:

- `CUSTOMER` – creates and tracks tickets
- `TECH` – works assigned tickets
- `ADMIN` – manages users, groups, and assignments

Stored as a custom Cognito attribute:

- `custom:role = CUSTOMER | TECH | ADMIN`

---

## 4. Identity Sources and Priority

The backend infers the current user in this order:

1. **Cognito JWT (Production source)**
   - From `Authorization: Bearer <access_token>` header.
   - Parsed by API Gateway JWT authorizer and Lambda.

2. **Header override (Development / Testing only)**
   - `x-user-id: some_user_id`
   - Used for quick local testing and demos while Cognito rollout is in progress.

3. **Fallback demo user**
   - `userId = "demo-user"`
   - Used when neither JWT nor header is present (for non-sensitive demo routes).

This enables a **hybrid phase** while moving to full Cognito.

---

## 5. Cognito Implementation

### 5.1 User Pool Configuration

AWS Service: **Amazon Cognito User Pools**  
Region: (e.g.) `us-east-1` to match API region.

Configuration:

- **Sign-in options**:
  - Allow username and/or email sign-in.
- **Password policy**:
  - Use AWS recommended defaults or stricter.
- **Account recovery**:
  - Email-based recovery.
- **Verification**:
  - Email verification enabled.

The User Pool is the authoritative store for:

- user identity (id, email)
- role (via custom attribute)
- credentials

---

### 5.2 App Client (Frontend Integration)

Create a **User Pool App Client**:

- No client secret (for browser/mobile apps).
- Enable:
  - Authorization code grant (for future hosted UI/OAuth).
  - OpenID Connect scopes as needed.

The app client ID will be used by the frontend when requesting tokens.

---

### 5.3 Custom Attribute for Role

Create a custom attribute:

- Name: `custom:role`
- Type: String
- Example values:
  - `CUSTOMER`
  - `TECH`
  - `ADMIN`

When users are created (via Admin API or UI):

- Assign role at creation time, e.g. `custom:role = "TECH"`.

---

### 5.4 Example User Records in Cognito

User `customer_ashley`:

- username: `customer_ashley`
- email: `ashley@example.com`
- custom:role: `CUSTOMER`

User `tech_mike`:

- username: `tech_mike`
- email: `mike.tech@example.com`
- custom:role: `TECH`

User `admin_jordan`:

- username: `admin_jordan`
- email: `admin.jordan@example.com`
- custom:role: `ADMIN`

---

## 6. API Gateway – JWT Authorizer

The HTTP API in API Gateway uses a **JWT authorizer** to validate Cognito tokens.

Configuration:

- **Identity source**:
  - `Authorization` header
- **Issuer URL**:
  - `https://cognito-idp.<region>.amazonaws.com/<user_pool_id>`
- **Audience**:
  - App client ID(s) created in Cognito

Routes can be configured to:

- Require the JWT authorizer for protected operations.
- Stay “open” (no authorizer) for dev/demo or public endpoints.

---

## 7. Backend: User Context (get_current_user)

Lambda functions use a helper, conceptually:

```python
def get_current_user(event):
    """
    Resolve the current user and role from:
    1. JWT (Cognito) if available
    2. x-user-id header (dev/testing)
    3. fallback demo user
    """
    user_id = None
    role = None
    auth_source = None

    # 1. Try Cognito JWT via API Gateway requestContext
    authorizer = event.get("requestContext", {}).get("authorizer", {})
    jwt_claims = authorizer.get("jwt", {}).get("claims", {}) or authorizer.get("claims", {})

    if jwt_claims:
        # Cognito 'sub' is typically the unique user id
        user_id = jwt_claims.get("sub")
        role = jwt_claims.get("custom:role")
        auth_source = "JWT"

    # 2. If no JWT, try x-user-id header (dev / test only)
    if user_id is None:
        headers = event.get("headers", {}) or {}
        header_user_id = headers.get("x-user-id") or headers.get("X-User-Id")
        if header_user_id:
            user_id = header_user_id
            # Default dev role can be configured; for now assume CUSTOMER
            role = role or "CUSTOMER"
            auth_source = "HEADER"

    # 3. Fallback demo user
    if user_id is None:
        user_id = "demo-user"
        role = "CUSTOMER"
        auth_source = "DEMO"

    return {
        "userId": user_id,
        "role": role,
        "authSource": auth_source
    }
```

All Lambda handlers should call get_current_user(event) and enforce role-based permissions based on:

userId

role

authSource

8. Route Protection (RBAC)

Summary of access per role:
| Endpoint                        | CUSTOMER         | TECH                       | ADMIN       |
| ------------------------------- | ---------------- | -------------------------- | ----------- |
| POST /tickets                   | Allowed (self)   | Allowed                    | Allowed     |
| GET /tickets                    | Only own tickets | Assigned / group tickets   | All tickets |
| GET /tickets/{ticketId}         | Own tickets only | Assigned / group           | Any ticket  |
| PATCH /tickets/{ticketId}       | Not allowed      | Allowed for assigned/group | Allowed     |
| GET /tickets/{id}/messages      | Own tickets only | Assigned / group           | Any ticket  |
| POST /tickets/{id}/messages     | Own tickets only | Assigned / group           | Any ticket  |
| GET /admin/users                | Not allowed      | Not allowed                | Allowed     |
| POST /admin/users               | Not allowed      | Not allowed                | Allowed     |
| GET /admin/groups               | Not allowed      | Not allowed                | Allowed     |
| POST /admin/groups              | Not allowed      | Not allowed                | Allowed     |
| GET /admin/tickets              | Not allowed      | Not allowed                | Allowed     |
| POST /admin/tickets/{id}/assign | Not allowed      | Not allowed                | Allowed     |

Enforcement happens inside Lambda using:

the role from get_current_user

resource ownership (e.g. does createdByUserId match current user?)

assignment (e.g. does assignedTechId or assignedGroupId match?)

9. Hybrid Migration Plan
Phase 1 – Current Hybrid

JWT support is enabled where available.

x-user-id header still works for dev and testing.

demo-user fallback only on non-sensitive routes.

Phase 2 – Partial Enforcement

Enable JWT authorizer on:

all /admin/* routes

selected /tickets routes

Keep x-user-id for dev-internal environments only.

Phase 3 – Full Enforcement

All protected routes require JWT.

x-user-id override disabled or limited to local dev API.

demo-user only used in explicit demo environments.

10. Security Practices

No passwords logged.

JWT secrets handled by AWS Cognito and API Gateway, not in code.

Tokens validated by JWT authorizer before Lambda runs.

Role checks are done server-side.

Access to CloudWatch logs is restricted.

11. Cognito Setup Checklist (Console Steps)

This section is a practical checklist to fully configure Cognito for this platform.

Create a User Pool

Go to: Amazon Cognito → User Pools → “Create user pool”.

Name: it-services-platform-users (or similar).

Enable:

Email as a sign-in option.

Email verification.

Add Custom Attribute

In the User Pool, open “Attributes”.

Add custom attribute:

Name: role (will be referenced as custom:role).

Type: String.

Create App Client

In the User Pool, open “App clients”.

Create a new app client for web/mobile frontend.

Disable client secret for browser/mobile.

Note: App client ID (needed by frontend).

Create Initial Users

Use “Create user” in the console or Admin API.

Set:

username (e.g. customer_ashley)

email

temporary password

set custom:role for:

customer_ashley → CUSTOMER

tech_mike → TECH

admin_jordan → ADMIN

Configure Hosted UI (Optional for Future)

In Cognito, configure a domain (e.g. thewinningteam-it-service).

Configure redirect URIs for your frontend.

Configure API Gateway JWT Authorizer

Go to your HTTP API in API Gateway.

Create a JWT authorizer:

Issuer: https://cognito-idp.<region>.amazonaws.com/<user_pool_id>

Audience: <app_client_id>

Attach this authorizer to protected routes.

Update Lambdas to Use get_current_user

Ensure each Lambda handler:

calls get_current_user(event)

enforces role and userId rules as described above.

Test

Login via Cognito and obtain a JWT.

Call protected endpoints with:

Authorization: Bearer <token>

Confirm:

role is read correctly

restricted endpoints behave as expected.

