import { submit, syncSheet, telegram, json, money } from './lib.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
  try { const row = await submit(req.body, 'website'); const synced = await syncSheet(row); let confirmation = 'Website submission saved.';
    if (row.notification_chat_id) try { await telegram(row.notification_chat_id, `${row.reference} recorded: ${money(row.amount_cents)}. Status: ${row.status}.`); confirmation += ' Telegram confirmation sent.'; } catch { confirmation += ' Record saved; Telegram confirmation could not be sent.'; }
    return json(res, 201, { transaction: synced, message: confirmation });
  } catch (error) { return json(res, 400, { error: error.message }); }
}
