// docs/assets/config.js
// Central config so BOTH products (customer + admin) stay consistent.

window.APP_CONFIG = {
  // Your existing API Gateway base (keep what you already use).
  // Example: "https://oeed3y9bkb.execute-api.us-east-1.amazonaws.com"
  API_BASE_URL: "https://oeed3y9bkb.execute-api.us-east-1.amazonaws.com",

  // Routes (your current backend seems to use /tickets)
  CUSTOMER_TICKETS_PATH: "/tickets",

  // NEW (Phase 2): when you create admin lambda + routes, use this.
  // Example: "/admin"
  ADMIN_BASE_PATH: "/admin",

  // Dev-mode identities (you can change labels later)
  DEV_USERS: {
    customer: "customer_ashley",
    tech: "tech_mike",
    admin: "admin_jordan",
  },
};
