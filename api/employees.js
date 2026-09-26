import { updateEmployee, json } from './lib.js';
export default async function handler(req, res) {
  if (req.method !== 'PATCH') return json(res, 405, { error: 'PATCH only' });
  try { if (req.body.actor !== 'svetlana') throw new Error('Only Svetlana can link Telegram accounts.'); const row = await updateEmployee(req.body.code, { telegram_user_id: String(req.body.telegramUserId || '').trim() || null, telegram_chat_id: String(req.body.telegramChatId || '').trim() || null }); return json(res, 200, { employee: row }); }
  catch (error) { return json(res, 400, { error: error.message }); }
}
