// Mock Server sederhana tanpa proteksi di Port 3000
const http = require('http');

const server = http.createServer((req, res) => {
  // Simulasi kebocoran header & CORS terbuka
  res.setHeader('X-Powered-By', 'Express');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  res.writeHead(200);
  res.end(JSON.stringify({ status: 'ok', message: 'Hello from local API!' }));
});

server.listen(3000, () => {
  console.log('🚀 Local server running on http://localhost:3000');
});