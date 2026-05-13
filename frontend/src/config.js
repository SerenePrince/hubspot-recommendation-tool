/**
 * Developer configuration flags.
 *
 * These control UI behaviour that the client may want to tune before go-live.
 * Change a value here and the whole app picks it up — no component digging required.
 */

/**
 * Sets the default state of the "reveal unmapped technologies" toggle in the
 * results table. Users can always flip the toggle themselves in-session.
 *
 * false (production default): the toggle starts collapsed — only technologies
 *   with a HubSpot recommendation are shown. A "reveal N unmapped" link lets
 *   users expand on demand. Keeps the report focused on actionable insights.
 *
 * true (developer convenience): the toggle starts expanded — all detected
 *   technologies are visible immediately, including unmapped ones. Useful when
 *   auditing mapping coverage and clicking "reveal" every run gets tedious.
 */
export const SHOW_UNMAPPED_TECHNOLOGIES = false;
