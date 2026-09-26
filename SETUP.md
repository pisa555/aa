# Deployment checklist

## 1. Supabase (required)

1. Create a new Supabase project.
2. In **SQL Editor**, open and run [`supabase/schema.sql`](supabase/schema.sql).
3. In **Project Settings → API**, copy the Project URL and the `service_role` key.
4. Set these as `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel. The service role key must remain server-only.

## 2. Telegram (required for S01 and E01)

1. In Telegram, message **@BotFather**, create a bot, and save its token.
2. Add `TELEGRAM_BOT_TOKEN` to Vercel environment variables.
3. Deploy the site first, then visit this URL in a browser (substitute values):
   `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<YOUR-VERCEL-URL>/api/telegram`
4. Start a private chat with the bot. In the site’s Manager panel, paste your numeric Telegram user ID (obtain it through any Telegram ID bot) beside Richard, then submit S01. Re-link the same user to Kevin and submit E01. The old record retains its original chat ID.

## 3. Google Sheets (required)

1. In Google Cloud Console, create a project and enable **Google Sheets API**.
2. Create a service account and create a JSON key. Its `client_email` and `private_key` become `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` in Vercel.
3. Create a Sheet with tabs exactly named `Sales` and `Expenses`. Add a header row to each; share it with the service account email as **Editor**.
4. Copy the spreadsheet ID from its URL into `GOOGLE_SHEETS_ID` in Vercel.
5. Give the instructor Viewer access. Do not allow public editing.

## 4. GitHub and Vercel (required submission)

1. Create a private or instructor-accessible GitHub repository, commit this project, and push it. Do not commit `.env.local`.
2. In Vercel, choose **Add New → Project**, import the repository, and add every environment variable above for Production and Preview.
3. Deploy. In the site footer, paste the deployed URL into the Telegram webhook request in step 2.
4. Run Test 1, then Test 2. Submit the Vercel URL only in your own course-spreadsheet row.

## Test order

Use the exact table data from the homework document. Clear practice records before S01/E01. After Test 1, results must be A €700, B €1,800, company €2,400. After Test 2, they must be A €2,050, B €2,180, company €3,930, with total commissions €530.
