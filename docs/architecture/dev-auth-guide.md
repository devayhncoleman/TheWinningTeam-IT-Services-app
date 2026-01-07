# Dev Auth Guide – Talk-Through Version

Version: 1.0  
Owner: Team A – The Winning Team  
Last Updated: 2026-01-06

---

## 1. What “Auth” Means (Kid Simple)

Think of the app like a school:

- The **building** is the API.
- The **students and teachers** are the users.
- The **ID badges** are how we know who you are.
- The **role** (student, teacher, principal) decides what you can do.

In our app:

- The **ID badge** is either:
  - a simple header (`x-user-id`) during development  
  - or a **JWT token** from Cognito in the future.

The backend needs two things:

1. **Who are you?** → `userId`  
2. **What are you allowed to do?** → `role` (`CUSTOMER`, `TECH`, `ADMIN`)

---

## 2. Two Ways to “Show Your ID” In Dev

During development, we support **two** ways to tell the backend who you are:

1. **Easy mode: header**
2. **Real mode: Cognito JWT (later)**

### 2.1 Easy Mode: `x-user-id` Header

This is like walking up to the teacher and saying:

> “Hi, I’m Ashley, treat me like the customer.”

We do that with a header:

- `x-user-id: customer_ashley`
- or `x-user-id: tech_mike`
- or `x-user-id: admin_jordan`

When the backend sees this header, it pretends you are that user.

This is **only for development and demos**, not for real production.

---

### 2.2 Real Mode: Cognito + JWT (Later)

Later, in “grown-up mode”, users will:

1. Log in with a username and password (Cognito).
2. Cognito will give them a **JWT** (a signed token).
3. The frontend sends the JWT to the backend like this:

   `Authorization: Bearer <token>`

The backend reads the token and learns:

- who the user is  
- what their role is (CUSTOMER, TECH, ADMIN)

For now, it’s okay if you only use the **header trick** while Cognito is being set up.

---

## 3. How the Backend Decides Who You Are

Every request goes through a helper (conceptually):

1. It checks:  
   “Do I see a valid JWT from Cognito?”
2. If not, it checks:  
   “Do I see an `x-user-id` header?”
3. If not, it falls back to a fake demo user.

---

## 4. How to Test as Different Users (Step by Step)

### 4.1 Using a REST client (like Postman or Thunder Client)

Pick one **test user**:

- `customer_ashley` (CUSTOMER)
- `tech_mike` (TECH)
- `admin_jordan` (ADMIN)

#### Example: Act as Ashley (customer)

**Request:**

- Method: `GET`
- URL: `https://<your-api-id>.execute-api.us-east-1.amazonaws.com/tickets`
- Headers:
  - `x-user-id: customer_ashley`

What this means:

- “Hey backend, I’m Ashley. Show me **my tickets**.”

#### Example: Act as Mike (tech)

- Method: `GET`
- URL: `/tickets`
- Headers:
  - `x-user-id: tech_mike`

Backend logic:

- “You’re a TECH. Show you tickets assigned to you or your group.”

#### Example: Act as Jordan (admin)

- Method: `GET`
- URL: `/admin/tickets`
- Headers:
  - `x-user-id: admin_jordan`

Backend logic:

- “You’re an ADMIN. You can see all tickets.”

---

### 4.2 Using PowerShell (like you’ve been doing)

**Example: create a ticket as Ashley**

```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://<your-api-id>.execute-api.us-east-1.amazonaws.com/tickets" `
  -ContentType "application/json" `
  -Headers @{ "x-user-id" = "customer_ashley" } `
  -Body '{
    "title": "Printer not working",
    "description": "The printer on floor 3 is jammed again.",
    "priority": "HIGH",
    "isEmergency": "NORMAL"
  }'
```
**Example: list tickets as Mike (tech)**

```powershell
Invoke-RestMethod -Method GET `
  -Uri "https://<your-api-id>.execute-api.us-east-1.amazonaws.com/tickets" `
  -Headers @{ "x-user-id" = "tech_mike" }
```

**Example: list all tickets as Jordan (admin)**

```powershell
Invoke-RestMethod -Method GET `
  -Uri "https://<your-api-id>.execute-api.us-east-1.amazonaws.com/admin/tickets" `
  -Headers @{ "x-user-id" = "admin_jordan" }
```

5. What Each Role Should Be Able to See/Do (Dev Checklist)

Use this as a quick test checklist.

5.1 CUSTOMER (x-user-id: customer_ashley)

POST /tickets → should work (create)

GET /tickets → should return only Ashley’s tickets

GET /tickets/{id} → only if Ashley created that ticket

GET /tickets/{id}/messages → only if Ashley owns it

POST /tickets/{id}/messages → only if Ashley owns it

/admin/* → should be blocked

5.2 TECH (x-user-id: tech_mike)

GET /tickets → should show tickets:

assigned directly to Mike

or to Mike’s group

PATCH /tickets/{id} → should work only for tickets he owns/assigned

POST /tickets/{id}/messages → should work where assigned

/admin/* → should be blocked

5.3 ADMIN (x-user-id: admin_jordan)

GET /admin/tickets → should show all tickets

POST /admin/tickets/{id}/assign → can assign tickets

GET /admin/users → should work

POST /admin/users → should work

GET /admin/groups / POST /admin/groups → should work

Admins can usually access everything, but the frontend doesn’t need to show all of it at once.

6. How This Changes When Cognito is Live

Right now (dev):

You mostly use:

x-user-id header

Cognito is being wired up in the background.

Later (real auth):

User logs into Cognito.

Frontend gets a JWT (ID or access token).

Frontend sends:

Authorization: Bearer <token>

Backend uses get_current_user to read:

userId (from sub)

role (from custom:role)

Good news:
The endpoints and flows stay the same.
Only how you “show your ID badge” changes.

7. Dev Rules of Thumb

If you just want to try something quickly → use x-user-id.

If a route is /admin/... → use an admin user id.

If something “mysteriously fails,” check:

Did you send any identity (x-user-id or JWT)?

Are you using the right role for that action?

