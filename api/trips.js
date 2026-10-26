// Archivio dei viaggi di Laura: un unico file JSON in un Vercel Blob PRIVATO.
// Ogni salvataggio conserva anche la versione precedente in laura/history/.
const { get, put } = require('@vercel/blob');
const crypto = require('crypto');

const KEY = 'laura/trips.json';
const HIST = n => 'laura/history/' + String(n).padStart(6, '0') + '.json';
const MAX_BYTES = 900 * 1024;

function sameCode(given, expected) {
  const a = crypto.createHash('sha256').update(String(given)).digest();
  const b = crypto.createHash('sha256').update(String(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}

async function readCurrent() {
  const r = await get(KEY, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200) return { rev: 0, data: {} };
  const parsed = JSON.parse(await new Response(r.stream).text());
  return { rev: Number(parsed.rev) || 0, data: parsed.data && typeof parsed.data === 'object' ? parsed.data : {} };
}

function write(pathname, obj) {
  return put(pathname, JSON.stringify(obj), {
    access: 'private',
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: 'application/json',
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const code = process.env.ACCESS_CODE;
  if (!code || !process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'non-configurato' });
  }
  if (!sameCode(req.headers['x-access-code'] || '', code)) {
    return res.status(401).json({ error: 'codice' });
  }
  try {
    const cur = await readCurrent();
    if (req.method === 'GET') return res.status(200).json(cur);

    if (req.method === 'PUT') {
      const b = req.body || {};
      if (typeof b.rev !== 'number' || !b.data || typeof b.data !== 'object' || Array.isArray(b.data)) {
        return res.status(400).json({ error: 'richiesta' });
      }
      if (b.rev !== cur.rev) return res.status(409).json({ current: cur });
      const next = { rev: cur.rev + 1, data: b.data, savedAt: new Date().toISOString() };
      if (JSON.stringify(next).length > MAX_BYTES) return res.status(413).json({ error: 'troppo-grande' });
      if (cur.rev > 0) await write(HIST(cur.rev), cur); // versione precedente, mai persa
      await write(KEY, next);
      return res.status(200).json({ rev: next.rev });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'metodo' });
  } catch (e) {
    console.error('trips api error', e && e.message);
    return res.status(502).json({ error: 'archivio' });
  }
};
