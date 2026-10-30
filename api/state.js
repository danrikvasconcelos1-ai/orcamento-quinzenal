'use strict';
const A = require('../lib/auth');
const S = require('../lib/store');

module.exports = async (req, res) => {
  const user = A.readSession(req);
  if (!user) return A.send(res, 401, { error: 'login' });
  if (!S.configured()) return A.send(res, 503, { error: 'sem-banco' });
  try {
    if (req.method === 'GET') {
      const d = await S.load();
      return A.send(res, 200, d ? { json: d.json, updatedAt: d.updatedAt, by: d.by } : { json: null, updatedAt: null });
    }
    if (req.method === 'PUT') {
      if (!A.isJson(req)) return A.send(res, 415, { error: 'tipo' });
      const b = await A.readBody(req);
      if (!b || typeof b.json !== 'string' || b.json.length > 900000) return A.send(res, 400, { error: 'dados' });
      try { const p = JSON.parse(b.json); if (!p || !Array.isArray(p.months)) throw 0; } catch (e) { return A.send(res, 400, { error: 'formato' }); }
      const cur = await S.load();
      if (cur && cur.updatedAt && b.base !== cur.updatedAt) {
        return A.send(res, 409, { error: 'conflito', updatedAt: cur.updatedAt, by: cur.by });
      }
      const updatedAt = new Date().toISOString();
      await S.save({ json: b.json, updatedAt, by: user });
      return A.send(res, 200, { ok: true, updatedAt });
    }
    return A.send(res, 405, { error: 'metodo' });
  } catch (e) {
    return A.send(res, 502, { error: 'banco' });
  }
};
