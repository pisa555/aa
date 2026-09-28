import { allTransactions, employeeByCode, employees, results, json } from './lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'GET only' });
  }

  try {
    const actorCode = String(req.query?.actor || '').trim();

    if (!actorCode) {
      return json(res, 400, {
        error: 'Choose a demonstration role before loading records.'
      });
    }

    const actor = await employeeByCode(actorCode);

    if (!actor) {
      return json(res, 403, { error: 'Unknown demonstration role.' });
    }

    const allRows = await allTransactions();

    const rows = actor.role === 'manager'
      ? allRows
      : allRows.filter(row => row.submitter_id === actor.id);

    return json(res, 200, {
      transactions: rows,
      employees: actor.role === 'manager' ? await employees() : [],
      results: actor.role === 'manager' ? results(rows) : null
    });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
}
