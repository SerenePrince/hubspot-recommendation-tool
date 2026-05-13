/**
 * Site header.
 *
 * Renders the Inbox logo centred inside a full-width dark bar at the top of
 * every page. Purely presentational — no props, no state.
 */
export default function Header() {
  return (
    <header className="header">
      <img className="header__logo" src="/images/logo.svg" alt="Inbox logo" />
    </header>
  );
}
