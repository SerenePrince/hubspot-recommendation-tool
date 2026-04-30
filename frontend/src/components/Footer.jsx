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
          <div className="footer__links-left">
            <a
              href="https://www.facebook.com/inboxcommunications"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
            <a
              href="https://x.com/inboxtweets"
              target="_blank"
              rel="noopener noreferrer"
            >
              X (Twitter)
            </a>
            <a
              href="https://www.linkedin.com/company/inboxcommunications/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>

        <div className="footer__center">
          <h5>© {new Date().getFullYear()} Inbox</h5>
        </div>

        <div className="footer__right">
          <a
            href="https://www.inboxcommunications.com/"
            target="_blank"
            rel="noopener noreferrer"
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
