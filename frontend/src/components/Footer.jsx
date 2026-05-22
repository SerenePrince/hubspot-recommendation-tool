/**
 * Site footer.
 *
 * Two sections:
 *   1. Three-column content row (collapses to a stacked column below 1024 px):
 *        Left   — Inbox logo (linking to inboxcommunications.com) + social
 *                 links (Facebook, X/Twitter, LinkedIn) in a <nav> landmark.
 *        Centre — dynamic copyright year.
 *        Right  — HubSpot Platinum Solutions Partner badge.
 *   2. Disclaimer row — a single full-width line setting honest expectations
 *      about detection accuracy. Sits below the content row, separated by a
 *      hairline, so it reads as a legal/informational footnote rather than
 *      primary footer content.
 *
 * Purely presentational — no props, no state.
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__left">
          <a
            href="https://www.inboxcommunications.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Inbox Communications website"
          >
            <img
              className="footer__logo-inbox"
              src="/images/logo.svg"
              alt="Inbox Communications"
            />
          </a>
          <nav className="footer__links-left" aria-label="Inbox social media">
            <ul className="footer__social-list">
              <li>
                <a
                  href="https://www.facebook.com/inboxcommunications"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/inboxtweets"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  X (Twitter)
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/inboxcommunications/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="footer__center">
          <p className="footer__copyright">
            &copy; {new Date().getFullYear()} Inbox
          </p>
        </div>

        <div className="footer__right">
          <img
            className="footer__logo-hubspot"
            src="/images/HubSpot_Platinum_Solutions_Partner_Large.png"
            alt="HubSpot Platinum Solutions Partner"
          />
        </div>
      </div>

      {/* Disclaimer — sets honest expectations about detection accuracy.
          Technology detection is based on publicly observable signals and
          cannot identify every tool a site uses. */}
      <p className="footer__disclaimer">
        Detection results are best-effort and intended as a guide only. Some
        technologies may not be identified due to security restrictions, content
        delivery methods, or limited publicly observable signals.
      </p>
    </footer>
  );
}
