import { transaction, syncSheet, telegram, update, json } from './lib.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
  try { const row = await transaction(req.body.reference); if (!row) throw new Error('Transaction not found.'); if (req.body.kind === 'sync') return json(res, 200, { transaction: await syncSheet(row) });
    if (req.body.kind === 'notification') { await telegram(row.notification_chat_id, `Please review decision for ${row.reference} in Friends Included.`); return json(res, 200, { transaction: await update(row.reference, { notification_status: 'sent', notification_error: null }) }); }
    throw new Error('Unknown retry kind.');
  } catch (error) { return json(res, 400, { error: error.message }); }
}
