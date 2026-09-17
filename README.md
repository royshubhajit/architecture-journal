# The Architecture Fieldnotes

A personal publishing site for system-design and software-architecture essays. It includes a reader-first archive, search and topic browsing, selectable reading themes, article pages, a password-protected author dashboard, draft/publish states, and an email-ingestion API.

## Run locally

```bash
cp .env.example .env.local
pnpm dev
```

Without cloud credentials, posts save to `.data/posts.json` and images save under `public/uploads` for complete local testing. On Vercel, connect a public Blob store: the same routes automatically store both posts and images durably. Upstash Redis remains supported for post data when configured.

## Publish by email

Configure an inbound-email provider to POST normalized JSON to `/api/email/inbound` with `Authorization: Bearer <EMAIL_WEBHOOK_SECRET>`:

```json
{
  "from": "you@example.com",
  "subject": "[publish] Why leases expire",
  "text": "The article body in Markdown...",
  "topic": "Distributed systems"
}
```

`[publish]` publishes immediately. Any other subject creates a draft. The endpoint accepts only `AUTHOR_EMAIL`. An adapter can be added for the exact webhook payload of Resend, Postmark, Mailgun, or another provider.

## Vercel

1. Import this directory as a Vercel project and set the Root Directory to `architecture-journal`.
2. Add every variable from `.env.example` in Project Settings → Environment Variables.
3. Deploy, then add the custom domain in Project Settings → Domains and copy the DNS records Vercel provides into your DNS host.
4. Point the inbound address (for example `publish@your-domain.com`) to your email provider's webhook, using the deployed `/api/email/inbound` URL.

The app deliberately fails writes when Redis is missing so the dashboard never claims a post was saved when Vercel's ephemeral filesystem would discard it.
