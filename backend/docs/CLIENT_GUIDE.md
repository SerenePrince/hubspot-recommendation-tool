# Client Guide – HubSpot Recommendation Tool

## 1. What This Tool Is

The HubSpot Recommendation Tool is an internal web application that analyzes **publicly available** data and returns recommendations to support internal decision-making and research workflows.

**Key points:**

- Web-based (runs in a browser)
- No user accounts (shared access)
- No database (no internal records stored)
- Uses public data sources only
- Designed to be lightweight and low-maintenance

## Accessing the tool

Your administrator will provide a single URL to access the tool (for example a Render URL such as `https://<service>.onrender.com` or a custom domain).

When you open the URL in a browser, you may be prompted for a shared username/password.

## 2. What This Tool Is Not

This tool is not:

- A public product or customer portal
- A system of record
- A secure data vault
- A place to enter confidential, personal, or regulated data
- A replacement for HubSpot or internal analytics systems

## 3. How to Access the Tool

You will be provided with:

- A URL (web address)
- A shared username
- A shared password

When you open the URL, your browser will prompt you for credentials.

If the prompt does not appear or the page does not load, contact your technical owner (see Section 9).

## 4. Shared Login (Access Control)

This tool uses a **shared login** (one username/password for the team).

**Important implications:**

- All users share the same credentials
- Changing the password affects everyone
- There is no per-user activity tracking

If you believe credentials were shared externally, request a password rotation immediately.

## 5. Data Sources & Privacy

- The tool uses a local copy of a **public dataset**
- The tool does **not** store personal data
- The tool does **not** write data to external systems

**Guidance:** Do not input sensitive information into the tool.

## 6. Availability Expectations

This is a lightweight internal utility:

- It may be restarted during updates or maintenance
- Short downtime during deployment is expected
- No formal uptime SLA is provided unless agreed separately

## 7. What To Do If Something Breaks

If you experience:

- The site does not load
- Repeated login prompts
- Errors running analysis
- Unexpected results

Please send your technical owner:

- What you were trying to do
- The approximate time it happened
- Any error message shown
- A screenshot (helpful)

## 8. High-Level Security Notes

This tool uses:

- HTTPS (encrypted connection) when deployed correctly
- A shared access password to limit access
- Basic protections against automated brute-force attempts

It is designed to reduce casual/public access, not to provide high-security access control.

## 9. Support & Ownership

This tool should have an internal technical owner responsible for:

- Deployment and restarts
- Password rotation
- Handling bug reports and feature requests

Contact your designated owner through your internal support process.
