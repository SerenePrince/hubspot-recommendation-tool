export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__left">
          <img
            className="footer__logo-left"
            src="/images/HubSpot_Platinum_Solutions_Partner_Large.png"
            alt="HubSpot Platinum Solutions Partner"
          />
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
          <a
            href="https://www.inboxcommunications.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Inbox Communications website"
          >
            <img
              className="footer__logo-right"
              src="/images/logo.svg"
              alt="Inbox Communications"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
