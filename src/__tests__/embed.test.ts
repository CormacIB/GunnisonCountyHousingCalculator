import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..");

describe("embed-test.html", () => {
  it("exists and contains an iframe with src, width, and height attributes", () => {
    const html = readFileSync(join(ROOT, "embed-test.html"), "utf-8");
    expect(html).toMatch(/<iframe/i);
    expect(html).toMatch(/\bsrc=/i);
    expect(html).toMatch(/\bwidth=/i);
    expect(html).toMatch(/\bheight=/i);
  });
});

describe("Next.js framing headers", () => {
  it("next.config.ts explicitly permits framing via frame-ancestors", () => {
    const config = readFileSync(join(ROOT, "next.config.ts"), "utf-8");
    // Positive assertion: config must declare frame-ancestors so framing
    // is intentional and survives if someone later adds a security-headers preset.
    expect(config).toMatch(/frame-ancestors/i);
  });
});
