# Inbox Client Guide

This guide is for Inbox team members using the HubSpot Recommendation Tool. It explains what the tool does, how to run an analysis, and what to do if something fails.

## What The Tool Does

You enter a public website URL. The tool scans that site and returns:

- technologies it detected (CMS, analytics, scripts, etc.)
- HubSpot products that may replace or consolidate those tools

The result helps Inbox speed up early discovery work for prospective clients.

## What The Tool Does Not Do

- It does not log in to the target website.
- It does not crawl private pages.
- It does not store user-entered site data between requests.
- Some websites may block automated fetches, which can reduce detections.

## Step-By-Step: Run An Analysis

1. Open the tool URL provided by your team (for example `https://your-service.example`).
2. If prompted, enter your shared login username and password.
3. Paste a full URL (example: `https://example.com`).
4. Click `Submit`.
5. Wait a few seconds for the report.
6. Review:
   - Found Technology
   - Description (including category)
   - Recommendation (HubSpot products)

## Understanding Results

- If technologies are listed:
  - each row shows one detected technology
  - recommendations list mapped HubSpot products for that technology
- If no technologies are detected:
  - the site may hide signals or block analysis requests
  - try another public page on the same domain

## Docker Run Guide (IT/Admin)

### Prerequisites

- Docker installed
- Internet access from host machine

### Steps

1. In repo root, copy env template:

```bash
cp .env.example .env
```

2. Set auth credentials in `.env`:

```dotenv
AUTH_ENABLED=1
AUTH_USERNAME=your-user
AUTH_PASSWORD=your-pass
```

3. Start service:

```bash
docker compose up --build
```

4. Verify health:

```bash
curl http://localhost:3001/health
```

5. Open app:

```text
http://localhost:3001
```

## Common Problems

### Browser keeps asking for login

- Confirm username/password with admin
- Clear cached browser credentials and retry

### “Invalid URL format”

- Include `https://` or `http://`
- Use a full public URL

### No technologies detected

- Target site may block automated traffic
- Try another page/domain

### Error while analyzing

- Try again in a minute
- If error continues, send support:
  - URL tested
  - timestamp
  - screenshot/error text

## Support Contact

- Primary owner: `TODO: verify in source`
- Backup owner: `TODO: verify in source`
- Escalation channel: `TODO: verify in source`
