const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const port = Number(process.env.PORT || 3000);
const indexFile = path.join(__dirname, 'dist', 'index.html');
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'nodeapp',
  user: process.env.PGUSER || 'nodeapp',
  password: process.env.PGPASSWORD || 'local-only-password',
  connectionTimeoutMillis: 3000,
});
let shuttingDown = false;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForDatabase() {
  while (!shuttingDown) {
    try {
      await pool.query('SELECT 1');
      console.log('Successfully connected to PostgreSQL');
      return;
    } catch (error) {
      console.log(`Waiting for PostgreSQL: ${error.message}`);
      await delay(2000);
    }
  }
}

const server = http.createServer((request, response) => {
  if (request.url === '/health' || request.url === '/db-health') {
    pool.query('SELECT 1')
      .then(() => {
        response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
        response.end('{"status":"ok","database":"connected"}');
      })
      .catch(() => {
        response.writeHead(503, { 'content-type': 'application/json; charset=utf-8' });
        response.end('{"status":"waiting","database":"disconnected"}');
      });
    return;
  }

  if (request.url === '/' || request.url === '/index.html') {
    if (!fs.existsSync(indexFile)) {
      response.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Build output is not available.');
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(fs.readFileSync(indexFile));
    return;
  }

  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('Not found.');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Hello world! App listening on port ${port}`);
  void waitForDatabase();
});

async function shutdown() {
  shuttingDown = true;
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
