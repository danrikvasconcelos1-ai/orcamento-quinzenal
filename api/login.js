'use strict';
const A = require('../lib/auth');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async (req, res) => {
  if (req.method !== 'POST' || !A.isJson(req)) return A.send(res, 405, { error: 'metodo' });
  const b = await A.readBody(req);
  if (!b || typeof b.user !== 'string' || typeof b.password !== 'string') return A.send(res, 400, { error: 'dados' });
  const user = b.user.trim().toLowerCase();
  if (!A.verifyPassword(user, b.password)) {
    await sleep(700); // freia tentativas em sequência
    return A.send(res, 401, { error: 'Usuário ou senha incorretos.' });
  }
  A.send(res, 200, { ok: true, user }, { 'Set-Cookie': A.cookieHeader(A.makeSession(user), A.MAX_AGE) });
};
