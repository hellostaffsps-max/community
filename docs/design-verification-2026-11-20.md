# Landing and brand update — 2026-11-20

## Delivered

- Dedicated Arabic landing page with the original Goat Journey logo, current yellow identity, licensed local brand fonts, and existing brand photography.
- Shared branded header, footer, controls, forms and authentication presentation. No new external asset service or package was introduced.
- Recipe browsing moved to `/explore`; existing root search/filter URLs redirect with their query, method and page intact.
- Honest empty states without example recipes, fabricated members or counts. Closed registration is visible in the landing FAQ, footer and public recipe browser.

## Validation before release

- TypeScript check passed. Existing 23 Vitest checks passed.
- Next production build and Cloudflare/Vinext production build passed. Existing Vinext sourcemap, barrel-import optimization and plugin-timing warnings remain non-blocking.
- All seven HTTP smoke checks passed against both Next development and the local Cloudflare Worker preview: landing, discovery, account guard, closed signup, foreign-origin rejection, anonymous mutation rejection and media path validation.
- Browser inspection: landing at 320, 390, 820 and 1280 widths; no horizontal document overflow. Discovery and login checked at 390. FAQ expansion and Arabic search with Espresso selection verified. No real account created and no production recipe written.
- Original logo/photo assets load and local font styling is applied. Footer contrast corrected after full-page review. Narrow-screen heading size refined after responsive review.
- Read-only Supabase check: `direct_signup_disabled`, `google_signin_disabled`, and `app_signup_disabled` are all true; Auth and schema return HTTP 200.

Logged-in editor/account screens inherit the shared styles; no production login was performed, so those screens were not visually verified with a live user session.
