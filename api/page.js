'use strict';
const fs = require('fs');
const path = require('path');
const A = require('../lib/auth');

const read = (f) => fs.readFileSync(path.join(process.cwd(), 'app', f), 'utf8');

module.exports = (req, res) => {
  if (!A.hasLogins()) {
    res.statusCode = 500; res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('Configuração incompleta: crie as variáveis APP_USER_1 e APP_PASS_1 no Vercel e faça Redeploy.');
  }
  let user = null;
  try { user = A.readSession(req); } catch (e) {
    res.statusCode = 500; res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('Configuração incompleta: confira as variáveis APP_USER_1 e APP_PASS_1 no Vercel.');
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 200;
  if (!user) return res.end(read('login.html'));
  res.end(read('index.html').replace('/*__USER__*/null', JSON.stringify(user)));
};
