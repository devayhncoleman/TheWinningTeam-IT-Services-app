# TheWinningTeam-IT-Services-app

## Project Overview

This repository contains the source code and infrastructure for **TheWinningTeam-IT-Services Web Application**.

The goal of this project is to build a simple web application where small businesses and individual users can:

- View available IT services (e.g., helpdesk support, troubleshooting, network setup)
- Submit a service request / ticket
- Track the status of their requests
- Contact the IT team for follow-up

## 📖 Documentation

All documents are located in `/docs`.

Key Sections:

- Overview — `/docs/overview`
- Product Requirements — `/docs/product`
- Architecture — `/docs/architecture`
- Operations — `/docs/operations`
- Testing — `/docs/testing`
- Deployment — `/docs/deployment`


The long-term goal is to design the app so it can be deployed in a **cloud-native, DevOps-friendly** way using CI/CD and serverless backend services.

---

## Tech Stack (Planned)

- **Frontend:** HTML/CSS/JS (or React if approved by instructor)
- **Backend (Planned):** AWS API Gateway + AWS Lambda (Node.js or Python) + DynamoDB
- **Cloud Platform:** AWS
- **Version Control:** Git + GitHub (shared team repository)
- **Documentation:** Markdown in `/docs`

---

## Team Members & Roles

> Edit this section with your actual team names and roles.

- **DevOps & Backend Engineer – DeVayhn**
  - Sets up and maintains the GitHub repo structure
  - Plans and documents backend architecture
  - Helps design CI/CD and deployment strategy
- **Frontend Engineer – DeVayhn**
  - Implements the UI/UX for the IT services app
  - Works on responsive layout, forms, and display of service data
- **Tester / QA Engineer – DeVayhn**
  - Writes and executes test cases
  - Validates form behavior, error handling, and API integration
- **Product / Documentation Lead – DeVayhn**
  - Clarifies requirements and user stories
  - Maintains project documentation in `/docs`

> If you have fewer members, combine roles.  
> Example: one person might be both Frontend + QA.

---

## Repository Structure

```text
TheWinningTeam-IT-Services-app/
├─ backend/          # Lambda/function code and backend tests
├─ docs/             # Design docs, API specs, diagrams / UI code for the IT services app
├─ infra/            # Infrastructure-as-Code templates (future)
└─ README.md         # You are here
