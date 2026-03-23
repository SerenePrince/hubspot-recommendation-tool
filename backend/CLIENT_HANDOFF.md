# Client Handoff Guide (Non‑Developer Friendly)

This document is written for **non-developers**. It explains what the app is, how to access it, and what to do if something goes wrong.

If your organization has an IT administrator, the technical deployment details are in:

- `backend/docs/OPERATIONS_GUIDE.md`
- `backend/docs/RUNBOOK.md`

---

## 1) What this app does

The HubSpot Recommendation Tool analyzes a website URL and returns a report in your browser.

- You open the website in a browser
- You may be asked to log in (a shared username/password)
- You enter a website URL and click **Analyze**
- You see results on screen

---

## 2) How you access the app

Your team will provide **one URL** that looks like:

- `https://<something>.onrender.com` (Render hosting), or
- your organization’s custom domain

Open that link in Chrome/Edge/Firefox/Safari.

---

## 3) Logging in

When prompted, enter the **username and password** provided by your administrator.

> Tip: If you are not prompted to log in, contact your administrator — the app may not be in “protected mode”.

---

## 4) Using the app

1. Paste a website URL (example: `https://example.com`)
2. Click **Analyze**
3. Wait for results
4. If you see an error, copy the message and send it to support

---

## 5) Common issues (and what to do)

### “Authentication required” or repeated login prompts

- Make sure the username/password are correct
- If you recently changed passwords, close and re-open your browser
- If it still fails, contact your administrator

### “Invalid URL format”

- Ensure the URL starts with `https://`
- Try opening the URL in a new browser tab first

### “Request failed” / “Network error”

- Check your internet connection
- Try again in a few minutes
- If the issue persists, contact support with:
  - the time it happened
  - the URL you tried
  - a screenshot

---

## 6) Support contact

Provide your organization’s support contact here:

- Name:
- Email:
- Hours:

(For the student team: replace this section before sending to the client.)

---

## 7) What the client should NOT need to do

Clients should not need to:

- install Docker
- run terminal commands
- manage secrets

Those are handled by the hosting platform (Render) or an IT administrator.
