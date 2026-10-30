'use strict';
const crypto = require('crypto');

const COOKIE = 'orc_sess';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

/* Logins simples: APP_USER_1 / APP_PASS_1, APP_USER_2 / APP_PASS_2 ... (até 5) */
function plainUsers() {
  const out = [];
  for (let i = 1; i <= 5; i++) {
    const u = process.env['APP_USER_' + i], p = process.env['APP_PASS_' + i];
    if (u && p) out.push({ user: u.trim().toLowerCase(), pass: p });
  }
  return out;
}
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
function hasLogins() { return plainUsers().length > 0 || Object.keys(users()).length > 0; }

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  // Sem SESSION_SECRET: deriva a chave das senhas configuradas (trocar a senha encerra as sessões).
  const base = plainUsers().map((x) => x.user + ':' + x.pass).join('|') + '#' + (process.env.APP_USERS || '');
  if (base.length < 3) throw new Error('Nenhum login configurado.');
  return crypto.createHash('sha256').update('orcamento-quinzenal|' + base).digest('hex');
}
const b64 = (b) => Buffer.from(b).toString('base64url');
const sign = (payload) => crypto.createHmac('sha256', secret()).update(payload).digest('base64url');

function makeSession(user) {
  const payload = b64(JSON.stringify({ u: user, exp: Math.floor(Date.now() / 1000) + MAX_AGE }));
  return payload + '.' + sign(payload);
}
function readSession(req) {
  const raw = (req.headers.cookie || '').split(';').map((s) => s.trim()).find((s) => s.startsWith(COOKIE + '='));
  if (!raw) return null;
  const val = raw.slice(COOKIE.length + 1);
  const [payload, sig] = val.split('.');
  if (!payload || !sig) return null;
  const good = sign(payload);
  const a = Buffer.from(sig), b = Buffer.from(good);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!d.u || d.exp < Date.now() / 1000) return null;
    return d.u;
  } catch (e) { return null; }
}
function cookieHeader(value, maxAge) {
  const secure = process.env.NODE_ENV === 'development' || process.env.INSECURE_COOKIE === '1' ? '' : '; Secure';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

/* APP_USERS = {"daniel":"scrypt$<salt>$<hash>","karina":"scrypt$..."} */
function users() {
  try { return JSON.parse(process.env.APP_USERS || '{}'); } catch (e) { return {}; }
}
function hashPassword(pw, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  const h = crypto.scryptSync(String(pw), salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('hex')}$${h.toString('hex')}`;
}
function verifyPassword(user, pw) {
  const name = String(user || '').trim().toLowerCase();
  const got0 = sha(pw || '');
  let plainOk = false;
  plainUsers().forEach((x) => {
    const same = crypto.timingSafeEqual(sha(x.pass), got0);
    if (same && x.user === name) plainOk = true;
  });
  if (plainOk) return true;
  if (!Object.keys(users()).length) return false;
  const stored = users()[String(user || '').toLowerCase()];
  const parts = (stored || 'scrypt$00$00').split('$');
  const salt = parts[1] || '00';
  const want = Buffer.from(parts[2] || '00', 'hex');
  const got = crypto.scryptSync(String(pw || ''), Buffer.from(salt, 'hex'), want.length || 1, { N: 16384, r: 8, p: 1 });
  const ok = want.length === got.length && crypto.timingSafeEqual(want, got);
  return Boolean(stored) && ok;
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return null; } }
    return req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const c of req) { size += c.length; if (size > 1.5e6) return null; chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString() || 'null'); } catch (e) { return null; }
}
function send(res, status, obj, headers) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  Object.entries(headers || {}).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(obj));
}
const isJson = (req) => String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json');

module.exports = { hasLogins, COOKIE, MAX_AGE, makeSession, readSession, cookieHeader, hashPassword, verifyPassword, readBody, send, isJson };
