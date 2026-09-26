# Friends Included finance system

This Vercel application implements the Day 4 transaction workflow. Supabase holds the authoritative records; the site, Telegram webhook, and Google Sheets synchronizer all use the same server-side business rules.

## Local setup

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor.
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL and **service role** key. Never expose this key to the browser.
3. Install the Vercel CLI, then run `vercel dev`.
4. Open `http://localhost:3000`. The demo role selector is intentional for the assignment; authorization is still enforced inside the API.

## Telegram command format

After linking a Telegram numeric user ID to an employee in the manager screen, send the bot one of these private-chat commands:

```text
/sale S01|Olivia Rose|A|One proud uncle and an emotional grandmother|1000|50|30|20
/expense E01|Rented suit and fake pearl necklace for the relatives|Materials|120|A
```

The bot confirms only after the record is saved. Set the production webhook to `https://YOUR-VERCEL-URL/api/telegram`.

## Required environment configuration

The sections below intentionally require your own accounts and secrets. Follow [`SETUP.md`](SETUP.md) to connect Supabase, Telegram, Google Sheets, GitHub, and Vercel.
