Functional Requirements – IT Services Platform

Version: 1.0
Owner: Team A – The Winning Team
Last Updated: 2026-01-06

1. Purpose

This document defines role-based behavior for the IT Services Platform.

It describes:

What each user type can see

What actions they can perform

How the platform should respond

This guides frontend and backend development.

2. User Roles

CUSTOMER

TECH

ADMIN

Defined in the Security & Auth Model.

3. Customer Requirements
3.1 Core Capabilities

Customers must be able to:

Create new IT tickets

Mark tickets as emergency

View only their own tickets

View ticket details & status

Send and read ticket messages

See timestamps & assignments

View resolution status

3.2 Ticket Views

Customer ticket list includes:

ticket title

status

priority

emergency state

created date

last update date

They cannot:

assign tickets

change priority

close tickets manually (unless allowed later)

4. Technician Requirements
4.1 Core Capabilities

Technicians must be able to:

View tickets assigned to them

View group-assigned tickets

Update ticket status

Update ticket priority

Send & receive messages

View customer history

Mark tickets resolved

4.2 Ticket Views

Tech view includes:

all customer fields

assigned tech

assigned group

emergency indicators

5. Administrator Requirements
5.1 Core Capabilities

Admins must be able to:

Create and manage users

Assign user roles

Create and manage support groups

Assign tickets to techs

Assign tickets to groups

View all tickets

Filter tickets

Audit ticket history

Deactivate users

Manage escalation processes

5.2 Admin-Only Screens

User management

Group management

Ticket assignment console

Audit & reporting (future)

6. Non-Functional Requirements

Fast response performance

Mobile-friendly UI

Accessibility considered

Secure role enforcement

Cloud-native backend
