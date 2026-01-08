<!DOCTYPE html>
<html lang="en" data-theme="day">
<head>
  <meta charset="UTF-8" />
  <title>The Winning Team — Ticket Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Base site styles -->
  <link rel="stylesheet" href="style.css" />
  <!-- Ticket app “product UI” layer (new) -->
  <link rel="stylesheet" href="tickets-ui.css" />
</head>

<body>
  <div class="app-shell">
    <!-- Top bar: compact, executive, consistent -->
    <header class="app-topbar">
      <div class="app-topbar__left">
        <a class="brand" href="index.html" aria-label="Back to Home">
          <span class="brand__mark"></span>
          <span class="brand__text">The Winning Team</span>
        </a>

        <nav class="app-nav" aria-label="Primary">
          <a class="app-nav__link" href="index.html">Home</a>
          <a class="app-nav__link" href="Showcase.html">Showcase</a>
          <a class="app-nav__link is-active" href="tickets.html">Ticket App</a>
        </nav>
      </div>

      <div class="app-topbar__right">
        <button id="toggleThemeBtn" class="btn btn--ghost" type="button">
          Mode: <span id="themeLabel">Day</span>
        </button>
      </div>
    </header>

    <!-- Main content: full-width canvas (kills “two empty columns” feel) -->
    <main class="app-main">
      <!-- Hero / context -->
      <section class="panel panel--hero">
        <div class="panel__title">
          <h1>Customer Ticket Dashboard</h1>
          <p class="muted">
            Live data from AWS (API Gateway → Lambda → DynamoDB). Dev Mode simulates users via <code>x-user-id</code>.
          </p>
        </div>

        <div class="hero-badges">
          <span class="badge">Serverless</span>
          <span class="badge">Role-ready</span>
          <span class="badge">Chat enabled</span>
        </div>
      </section>

      <!-- Controls + Status -->
      <section class="panel">
        <div class="panel__header">
          <h2 class="h2">Dev Mode</h2>
          <p class="muted">Choose a user identity and load tickets.</p>
        </div>

        <div class="controls-row">
          <div class="field">
            <label for="userSelect">Act as</label>
            <select id="userSelect">
              <option value="customer_ashley">Customer — Ashley</option>
              <option value="tech_mike">Tech — Mike</option>
              <option value="admin_jordan">Admin — Jordan</option>
            </select>
          </div>

          <div class="field field--actions">
            <button id="loadTicketsBtn" class="btn btn--primary" type="button">
              Load Tickets
            </button>
          </div>
        </div>

        <div id="statusMessage" class="status"></div>
      </section>

      <!-- Tickets table -->
      <section class="panel">
        <div class="panel__header">
          <h2 class="h2">Tickets</h2>
          <p class="muted">Click a row to open the ticket detail + chat.</p>
        </div>

        <div class="table-wrap">
          <table id="ticketsTable" class="table table--tickets">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Emergency</th>
                <th>Created</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              <!-- Filled by tickets.js -->
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <footer class="app-footer">
      <p>Built by The Winning Team — Powered by AWS (API Gateway, Lambda, DynamoDB).</p>
    </footer>
  </div>

  <!-- Theme persistence FIRST (new, minimal, reliable) -->
  <script src="theme.js?v=9"></script>

  <!-- Your existing global JS can stay (music, etc) -->
  <script src="script.js?v=9"></script>

  <!-- Ticket logic -->
  <script src="tickets.js?v=9"></script>
</body>
</html>
