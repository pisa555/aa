import { decide, syncSheet, telegram, commission, update, json, money } from './lib.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
  try { const row = await decide(req.body); const synced = await syncSheet(row); let notification = 'No Telegram recipient linked.';
    if (row.notification_chat_id) try { const changed = row.type === 'sale' ? JSON.stringify(row.proposed_split) !== JSON.stringify(row.final_split) : row.proposed_allocation !== row.final_allocation;
      const detail = row.type === 'sale' ? `Sale ${row.reference} approved${changed ? ' — split changed' : ''}. Sale ${money(row.amount_cents)}; total commission ${money(commission(row.amount_cents, row.final_split).pool)}. Richard ${row.final_split.richard}% (${money(commission(row.amount_cents,row.final_split).amounts.richard)}), Anastasia ${row.final_split.anastasia}% (${money(commission(row.amount_cents,row.final_split).amounts.anastasia)}), Jean-Claude ${row.final_split.jeanclaude}% (${money(commission(row.amount_cents,row.final_split).amounts.jeanclaude)}).` : `Expense ${row.reference} allocated to ${row.final_allocation}${changed ? ` (changed from ${row.proposed_allocation})` : ''}: ${money(row.amount_cents)} — ${row.description}.`;
      await telegram(row.notification_chat_id, detail); await update(row.reference, { notification_status: 'sent', notification_error: null }); notification = 'Telegram notification sent.';
    } catch (error) { await update(row.reference, { notification_status: 'failed', notification_error: error.message }); notification = 'Decision saved; Telegram notification failed and can be retried.'; }
    return json(res, 200, { transaction: synced, message: notification });
  } catch (error) { return json(res, 400, { error: error.message }); }
}
