/**
 * Client-side URL validation for the analyze form.
 *
 * Returns an error message string when the input is invalid, or null when the
 * input is valid OR empty (empty input is handled separately by the form's
 * submit-disable logic, not as a validation error).
 *
 * Note: the UI deliberately accepts only https:// URLs even though the backend
 * also supports http:// targets — see backend/docs/API.md.
 *
 * @param {string} input - Raw text from the URL input field
 * @returns {string|null} Error message, or null when valid/empty
 */
export function validateUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return "Only https:// URLs are accepted.";
    }
    return null;
  } catch {
    return "Enter a valid URL (for example, https://example.com).";
  }
}
