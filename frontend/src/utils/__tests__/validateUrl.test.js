import { describe, it, expect } from "vitest";
import { validateUrl } from "../validateUrl";

describe("validateUrl", () => {
  it("returns null for a valid https URL", () => {
    expect(validateUrl("https://example.com")).toBeNull();
    expect(validateUrl("https://example.com/path?query=1")).toBeNull();
  });

  it("returns null for empty or whitespace-only input (handled by submit gating, not validation)", () => {
    expect(validateUrl("")).toBeNull();
    expect(validateUrl("   ")).toBeNull();
  });

  it("trims surrounding whitespace before validating", () => {
    expect(validateUrl("  https://example.com  ")).toBeNull();
  });

  it("rejects http:// URLs with the protocol message", () => {
    expect(validateUrl("http://example.com")).toBe(
      "Only https:// URLs are accepted.",
    );
  });

  it("rejects other protocols", () => {
    expect(validateUrl("ftp://example.com")).toBe(
      "Only https:// URLs are accepted.",
    );
    expect(validateUrl("javascript:alert(1)")).toBe(
      "Only https:// URLs are accepted.",
    );
  });

  it("rejects unparseable input with the format message", () => {
    expect(validateUrl("not a url")).toBe(
      "Enter a valid URL (for example, https://example.com).",
    );
    expect(validateUrl("example.com")).toBe(
      "Enter a valid URL (for example, https://example.com).",
    );
  });
});
