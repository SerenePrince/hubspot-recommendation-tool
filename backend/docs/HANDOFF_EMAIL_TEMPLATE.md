# Handoff Email Template – HubSpot Recommendation Tool

Subject: HubSpot Recommendation Tool – Deployment & Handoff Package

Hi <Client Name / Team>,

As discussed, we are handing off the HubSpot Recommendation Tool for internal use.

## What’s Included

- Deployed internal web application (URL below)
- Shared access credentials (delivered via a secure channel)
- Full documentation set for users, operators, and developers

## Access

- URL: https://<host>
- Username: <shared-username>
- Password: <shared-password> (provided separately via secure channel)

## Where to Start

- User guide: docs/CLIENT_GUIDE.md
- Operations guide: docs/OPERATIONS_GUIDE.md
- Developer guide: docs/DEVELOPER_GUIDE.md

## Operations / Verification

- Health check: GET /health
- Smoke test: SMOKE_BASE_URL=https://<host> npm run smoke

## Support / Ownership

Primary technical owner: <name/team>
Escalation path: <support email / channel / ticket queue>

Thanks,  
<Your Name>  
<Your Team>
