import { updateEmployee, employeeByTelegram, json } from './lib.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return json(res, 405, { error: 'PATCH only' });
  }

  try {
    if (req.body.actor !== 'svetlana') {
      throw new Error('Only Svetlana can link Telegram accounts.');
    }

    const userId = String(req.body.telegramUserId || '').trim() || null;
    const chatId = String(req.body.telegramChatId || '').trim() || null;

    const previous = userId ? await employeeByTelegram(userId) : null;

    if (previous && previous.code !== req.body.code) {
      await updateEmployee(previous.code, {
        telegram_user_id: null,
        telegram_chat_id: null
      });
    }

    const row = await updateEmployee(req.body.code, {
      telegram_user_id: userId,
      telegram_chat_id: chatId
    });

    return json(res, 200, { employee: row });
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
}
