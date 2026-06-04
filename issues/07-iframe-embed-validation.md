# Issue 7: iframe embed validation

**Label:** `ready-for-agent`
**Type:** HITL
**Blocked by:** Issue 6

## What to build

Validate that the deployed tool embeds correctly as an `<iframe>` on any arbitrary website, and produce the one-line embed snippet for the housing organization to use.

Create a minimal static test HTML page (a single `.html` file, not part of the Next.js app) that embeds the Vercel deployment URL in an `<iframe>`. This simulates how the tool will appear when dropped into an existing website.

Document the embed snippet — the exact `<iframe>` tag with recommended width/height attributes — so the housing organization can hand it to their web administrator.

## Acceptance criteria

- [ ] A minimal test HTML page exists that embeds the tool via `<iframe>`
- [ ] The embedded tool renders correctly and is fully functional within the iframe (form submits, results display, empty state works)
- [ ] The tool is usable on mobile within the iframe (no content clipped, no horizontal scroll)
- [ ] A human has visually verified the above on both desktop and a mobile viewport
- [ ] The embed snippet (`<iframe>` tag with src, width, height) is documented in the README or a dedicated embed guide

## Blocked by

Issue 6 (Calculator Form + Results View — the full UI must be complete and deployed before iframe validation)
