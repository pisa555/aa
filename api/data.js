import { allTransactions, employees, results, json } from './lib.js';
export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'GET only' });
  try { const rows = await allTransactions(); return json(res, 200, { transactions: rows, employees: await employees(), results: results(rows) }); }
  catch (error) { return json(res, 500, { error: error.message }); }
}
