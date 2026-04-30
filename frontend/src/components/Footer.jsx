export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__left">
          <img
            className="footer__logo-left"
            src="/images/HubSpot_Platinum_Solutions_Partner.png"
            alt="Inbox Communications Icon"
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
          <div className="footer__links-right">
            <a
              href="https://www.inboxcommunications.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              inboxcommunications.com
            </a>
          </div>
          <img
            className="footer__logo-right"
            src="/images/logo.png"
            alt="Inbox Communications Icon"
          />
        </div>
      </div>
    </footer>
  );
}
