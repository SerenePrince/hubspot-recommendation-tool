# Inbox Client Guide

This guide is for Inbox team members using the HubSpot Recommendation Tool.

## What the tool does

Paste in a website address and the tool will:

- detect what technologies that website uses
- show HubSpot options that could replace or consolidate those tools

## How to use it

1. Open the tool link shared by your team.
2. If prompted, sign in with the shared username and password.
3. Paste a full website URL (example: `https://example.com`).
4. Click **Analyze**.
5. Wait a few seconds for the report.
6. Review the results:
   - **Technology** — the detected tool and its category
   - **Description** — a short explanation of what that technology does
   - **HubSpot Replacement** — the recommended HubSpot product(s) that could replace it

## What the results mean

- Each row is one detected technology on the website.
- Recommendations show HubSpot products related to that detected tool.
- If a row shows **No recommendation mapped**, the technology has been detected but hasn't been mapped to a HubSpot product yet — your team can add this to the mapping file.
- If no technologies are detected at all, the target site may be blocking analysis.

## Common problems

### URL is rejected

- Make sure the URL starts with `https://`.
- Use the full website address including the `https://` prefix.

### No results or an error

- Retry once after a short wait.
- If the issue continues, send support:
  - the website URL you tested
  - the time it happened
  - a screenshot of the error

### Login prompt appears

If your deployment has authentication enabled:

- Re-check your username and password.
- Close and reopen the browser, then try again.

## Usage policies and expectations

### What this tool is not

- A public product or customer portal
- A system of record or a secure data vault
- A place to enter confidential, personal, or regulated data
- A replacement for HubSpot or internal analytics systems

### Shared login

If your deployment has authentication enabled, the tool uses a **shared login** (one username/password for the whole team). Changing the password affects everyone, there is no per-user activity tracking, and if you believe credentials were shared externally you should request a password rotation immediately.

### Data and privacy

The tool analyzes publicly available website data using a local copy of a public dataset. It does not store personal data and does not write data to external systems. Do not input sensitive information into the tool.

### Availability

This is a lightweight internal utility: it may be restarted during updates, short downtime during deployment is expected, and no formal uptime SLA is provided unless agreed separately.

## Support contact

- Primary support contact: Inbox to provide
- Backup support contact: Inbox to provide
- Escalation contact: Inbox to provide

The internal technical owner is responsible for deployment and restarts, password rotation, and handling bug reports and feature requests.
