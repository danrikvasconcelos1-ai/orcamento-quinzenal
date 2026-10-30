'use strict';
// Servidor local para testar sem o Vercel: node scripts/dev.js  (http://localhost:3000)
process.env.INSECURE_COOKIE = '1';
const http = require('http');
const routes = { '/': 'page', '/api/login': 'login', '/api/logout': 'logout', '/api/state': 'state' };
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  const name = routes[p];
  if (!name) { res.statusCode = 404; return res.end('404'); }
  require('../api/' + name + '.js')(req, res);
}).listen(port, () => console.log('http://localhost:' + port));
