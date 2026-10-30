'use strict';
const A = require('../lib/auth');
module.exports = (req, res) => {
  if (req.method !== 'POST') return A.send(res, 405, { error: 'metodo' });
  A.send(res, 200, { ok: true }, { 'Set-Cookie': A.cookieHeader('', 0) });
};
