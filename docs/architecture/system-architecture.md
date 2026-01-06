# System Architecture — TheWinningTeam IT Services Platform

This document describes the high-level architecture for **TheWinningTeam**, an IT services web/mobile application deployed on AWS.

The goals of this architecture are to be:

- Cloud-native
- Serverless (minimal infrastructure management)
- Scalable
- Easy to extend and operate (DevOps-friendly)

---

## 1. Component Overview

Core components:

- **Client Applications**
  - Web app (HTML/JS from `/docs` or future `/frontend`)
  - Future mobile app (or mobile-friendly web)
- **Amazon API Gateway**
  - Single entry point for all HTTP APIs
  - Routes requests to the appropriate AWS Lambda functions
- **AWS Lambda**
  - Stateless compute layer
  - Implements business logic (tickets, messages, emergency, admin)
- **Amazon DynamoDB**
  - NoSQL database for users, groups, tickets, messages, and audit logs
- **Amazon CloudWatch**
  - Centralized logs for Lambda
  - Metrics and alarms (future)
- **(Optional/Future) Amazon S3 + CloudFront**
  - Store and serve static web assets (HTML/CSS/JS)
  - CDN caching for performance

---

## 2. High-Level Architecture Diagram (Logical)

```text
+-----------------------+
|   Web / Mobile Client |
|  (Browser / Phone)    |
+----------+------------+
           |
           | HTTPS (JSON APIs)
           v
+-----------------------+
|    Amazon API Gateway |
+----------+------------+
           |
           | Invokes
           v
+-----------------------+
|       AWS Lambda      |
|  (Tickets, Messages,  |
|  Emergency, Admin)    |
+----------+------------+
           |
           | AWS SDK (DynamoDB)
           v
+-----------------------+
|     Amazon DynamoDB   |
|  Users / Groups /     |
|  Tickets / Messages / |
|  Audit Logs           |
+-----------------------+

          ^
          |
          | Logs / Metrics
+---------------------------+
|      Amazon CloudWatch    |
|  (Logs, Metrics, Alarms)  |
+---------------------------+

