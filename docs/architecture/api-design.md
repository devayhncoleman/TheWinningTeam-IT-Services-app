# API Design (Planned — AWS Lambda + API Gateway)

## Ticket Endpoints
POST   /tickets
GET    /tickets/{id}
GET    /tickets?user={id}
PATCH  /tickets/{id}
POST   /tickets/{id}/messages

## Admin Endpoints
POST   /groups
POST   /users
PATCH  /assign
GET    /admin/tickets

## Emergency
POST   /emergency

