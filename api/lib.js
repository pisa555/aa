import crypto from 'node:crypto';

const codes = ['richard', 'anastasia', 'jeanclaude'];
export const money = cents => `€${(Number(cents || 0) / 100).toFixed(2)}`;
export const json = (res, status, body) => res.status(status).json(body);

function env(name, required = true) {
  const value = process.env[name];
  if (required && !value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

async function db(path, options = {}) {
  const response = await fetch(`${env('SUPABASE_URL')}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(options.headers || {}) }
  });
  if (!response.ok) throw new Error(`Supabase: ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

export async function employees() { return db('employees?select=*&order=code'); }
export async function transaction(reference) { const rows = await db(`transactions?reference=eq.${encodeURIComponent(reference)}&select=*`); return rows[0]; }
export async function allTransactions() { return db('transactions?select=*&order=submitted_at.asc'); }
export async function employeeByCode(code) { const rows = await db(`employees?code=eq.${encodeURIComponent(code)}&select=*`); return rows[0]; }
export async function employeeByTelegram(id) { const rows = await db(`employees?telegram_user_id=eq.${encodeURIComponent(String(id))}&select=*`); return rows[0]; }
export async function updateEmployee(code, patch) { return (await db(`employees?code=eq.${encodeURIComponent(code)}`, { method: 'PATCH', body: JSON.stringify(patch) }))[0]; }
export async function insert(row) { return (await db('transactions', { method: 'POST', body: JSON.stringify(row) }))[0]; }
export async function update(reference, patch) { return (await db(`transactions?reference=eq.${encodeURIComponent(reference)}`, { method: 'PATCH', body: JSON.stringify(patch) }))[0]; }

export function splitFrom(input) {
  const split = Object.fromEntries(codes.map(code => [code, Number(input[code]) ]));
  if (codes.some(code => !Number.isFinite(split[code]) || split[code] < 0 || split[code] > 100) || codes.reduce((sum, code) => sum + split[code], 0) !== 100) throw new Error('Commission shares must each be 0–100 and total exactly 100%.');
  return split;
}
export function commission(amountCents, split) {
  const pool = Math.round(amountCents * 0.1);
  const result = Object.fromEntries(codes.map(code => [code, Math.round(pool * split[code] / 100)]));
  const difference = pool - codes.reduce((sum, code) => sum + result[code], 0);
  const winner = [...codes].sort((a, b) => split[b] - split[a])[0];
  result[winner] += difference;
  return { pool, amounts: result };
}
function required(value, name) { if (value === undefined || value === null || value === '') throw new Error(`${name} is required.`); return value; }

export async function submit(data, origin, linkedEmployee = null, chatId = null) {
  const actor = linkedEmployee || await employeeByCode(data.actor);
  if (!actor) throw new Error('Unknown employee.');
  const reference = String(required(data.reference, 'Reference')).trim().toUpperCase();
  if (await transaction(reference)) throw new Error('This reference already exists.');
  const amountCents = Math.round(Number(required(data.amount, 'Amount')) * 100);
  if (!Number.isInteger(amountCents) || amountCents <= 0) throw new Error('Amount must be greater than zero.');
  const common = { reference, submitter_id: actor.id, submitter_name: actor.display_name, origin, notification_chat_id: chatId || actor.telegram_chat_id || null, description: String(required(data.description, 'Description')).trim(), amount_cents: amountCents };
  if (data.type === 'sale') {
    if (actor.role !== 'sales') throw new Error('Only salespeople can submit sales.');
    const project = required(data.project, 'Project'); if (!['A','B'].includes(project)) throw new Error('Project must be A or B.');
    return insert({ ...common, type: 'sale', customer: String(required(data.customer, 'Customer')).trim(), project, proposed_split: splitFrom(data.split), status: 'pending_approval', sync_status: 'sync_pending' });
  }
  if (data.type === 'expense') {
    if (actor.role !== 'expense_reporter') throw new Error('Only Kevin can submit expenses.');
    const category = required(data.category, 'Category'); const allocation = required(data.allocation, 'Proposed allocation');
    if (!['Materials','Travel','Other'].includes(category) || !['A','B','Company overhead'].includes(allocation)) throw new Error('Invalid expense category or allocation.');
    const overhead = allocation === 'Company overhead';
    return insert({ ...common, type: 'expense', category, proposed_allocation: allocation, final_allocation: overhead ? allocation : null, status: overhead ? 'allocated' : 'awaiting_allocation', sync_status: 'sync_pending' });
  }
  throw new Error('Transaction type must be sale or expense.');
}

export async function decide(data) {
  const manager = await employeeByCode(data.actor);
  if (!manager || manager.role !== 'manager') throw new Error('Only Svetlana can approve or correct transactions.');
  const row = await transaction(data.reference);
  if (!row) throw new Error('Transaction not found.');
  if (row.type === 'sale') {
    if (row.status !== 'pending_approval') throw new Error('This sale is already approved.');
    const split = splitFrom(data.split); const payout = commission(row.amount_cents, split);
    return update(row.reference, { final_split: split, status: 'allocated', manager_id: manager.id, decided_at: new Date().toISOString(), sync_status: 'sync_pending', notification_status: row.notification_chat_id ? 'pending' : 'not_required', notification_error: null, decision_note: JSON.stringify(payout) });
  }
  if (row.status !== 'awaiting_allocation') throw new Error('This expense has already been allocated.');
  const allocation = data.allocation;
  if (!['A','B','Company overhead'].includes(allocation)) throw new Error('Choose A, B, or Company overhead.');
  return update(row.reference, { final_allocation: allocation, status: 'allocated', manager_id: manager.id, decided_at: new Date().toISOString(), sync_status: 'sync_pending', notification_status: row.notification_chat_id ? 'pending' : 'not_required', notification_error: null });
}

export function results(rows) {
  const out = { A: { income: 0, commissions: 0, expenses: 0 }, B: { income: 0, commissions: 0, expenses: 0 }, company: { overhead: 0, awaiting: 0, expenses: 0 }, people: Object.fromEntries(codes.map(c => [c, 0])) };
  for (const row of rows) {
    if (row.type === 'sale' && row.status === 'allocated') { const p = commission(row.amount_cents, row.final_split); out[row.project].income += row.amount_cents; out[row.project].commissions += p.pool; for (const c of codes) out.people[c] += p.amounts[c]; }
    if (row.type === 'expense') { out.company.expenses += row.amount_cents; if (row.status === 'awaiting_allocation') out.company.awaiting += row.amount_cents; else if (row.final_allocation === 'Company overhead') out.company.overhead += row.amount_cents; else if (row.final_allocation) out[row.final_allocation].expenses += row.amount_cents; }
  }
  for (const p of ['A','B']) out[p].result = out[p].income - out[p].commissions - out[p].expenses;
  out.company.income = out.A.income + out.B.income; out.company.commissions = out.A.commissions + out.B.commissions; out.company.result = out.company.income - out.company.commissions - out.company.expenses;
  return out;
}

async function googleToken() {
  const now = Math.floor(Date.now() / 1000); const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(JSON.stringify({ iss: env('GOOGLE_SERVICE_ACCOUNT_EMAIL'), scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })).toString('base64url');
  const key = env('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY').replace(/\\n/g, '\n'); const signature = crypto.createSign('RSA-SHA256').update(`${header}.${claim}`).sign(key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claim}.${signature}` }) });
  if (!r.ok) throw new Error(`Google authentication: ${await r.text()}`); return (await r.json()).access_token;
}
export async function syncSheet(row) {
  if (!process.env.GOOGLE_SHEETS_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) return update(row.reference, { sync_status: 'not_configured', sync_error: 'Google Sheets credentials are not configured.' });
  try {
    const token = await googleToken(), tab = row.type === 'sale' ? 'Sales' : 'Expenses';
    const values = row.type === 'sale' ? [row.reference, row.submitted_at, row.submitter_name, row.customer, row.project, row.description, money(row.amount_cents), JSON.stringify(row.proposed_split), JSON.stringify(row.final_split || {}), ...(row.final_split ? codes.map(c => money(commission(row.amount_cents, row.final_split).amounts[c])) : ['€0.00','€0.00','€0.00']), row.status] : [row.reference, row.submitted_at, row.submitter_name, row.description, row.category, money(row.amount_cents), row.proposed_allocation, row.final_allocation || '', row.status];
    const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env('GOOGLE_SHEETS_ID'))}/values/${encodeURIComponent(tab + '!A:A')}`;
    const existing = await fetch(base, { headers: { Authorization: `Bearer ${token}` } }); if (!existing.ok) throw new Error(await existing.text());
    const rows = (await existing.json()).values || []; const index = rows.findIndex(r => r[0] === row.reference);
    const range = `${tab}!A${index >= 0 ? index + 1 : rows.length + 1}`;
    const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env('GOOGLE_SHEETS_ID'))}/values/${encodeURIComponent(range)}${index >= 0 ? '?valueInputOption=USER_ENTERED' : ':append?valueInputOption=USER_ENTERED'}`;
    const response = await fetch(endpoint, { method: index >= 0 ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values: [values] }) }); if (!response.ok) throw new Error(await response.text());
    return update(row.reference, { sync_status: 'synced', sync_error: null });
  } catch (error) { return update(row.reference, { sync_status: 'sync_failed', sync_error: error.message }); }
}
export async function telegram(chatId, text) { if (!process.env.TELEGRAM_BOT_TOKEN || !chatId) throw new Error('No Telegram recipient linked.'); const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text }) }); if (!r.ok) throw new Error(await r.text()); }
