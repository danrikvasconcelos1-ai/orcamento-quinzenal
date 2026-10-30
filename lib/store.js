'use strict';
/* Banco: Upstash Redis via REST (integração do Vercel Marketplace). */
const URL_ = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const KEY = process.env.STATE_KEY || 'orcamento:estado';

const configured = () => Boolean(URL_() && TOKEN());
async function cmd(args) {
  const r = await fetch(URL_(), {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN(), 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error('store ' + r.status);
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
async function load() {
  const v = await cmd(['GET', KEY]);
  return v ? JSON.parse(v) : null; // {json, updatedAt, by}
}
async function save(doc) { await cmd(['SET', KEY, JSON.stringify(doc)]); }

module.exports = { configured, load, save };
