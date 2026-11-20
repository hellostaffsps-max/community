# Interior pages — 2026-11-20

## Changes

- Recipe details now use the existing Goat Journey identity: editorial heading, author and date, photo or branded fallback, preparation metrics, ingredient sheet, numbered steps, tasting notes, and discussion. Save, report, edit, and delete controls retain their existing API and authorization behavior.
- The account has a responsive navigation sidebar, separate published/draft/saved states, contextual empty states, and a three-part profile form with an Arabic photo selector and biography counter.
- Login and recovery screens share a branded layout and accessible password visibility control. Closed registration renders an explanation and browsing links without a signup form.
- Shared mobile controls, editor rows, public profile headings, and current-page navigation follow the same brand styles. No new assets or dependencies were required.

## Browser verification

- Recipe and account layouts inspected at desktop and mobile sizes; tested widths include 320, 390, 820, and 1440 pixels. No horizontal document overflow in the inspected views.
- Checked recipe preparation anchor, missing-photo fallback, private draft controls, and opening/canceling delete confirmation without deleting anything.
- Checked account navigation, saved empty state, profile field layout, Arabic photo control, and the biography counter after editing.
- Checked password show/hide and closed signup with no form at 320 pixels. Inspected ingredient editing at 320 pixels.
- Account and recipe content used temporary, development-only local fixtures. All writes were blocked during preview. No production user, recipe, comment, or image was created. Fixture code and the temporary proxy guard were removed before production builds.

## Automated verification

- TypeScript passed; all 23 existing Vitest tests passed.
- Next and Cloudflare/Vinext production builds passed. Existing Vinext import-optimization, sourcemap, and timing warnings remain non-blocking.
- All seven HTTP smoke checks passed against the final local Worker preview: landing, exploration, account guard, closed signup, foreign-origin rejection, anonymous mutation rejection, and media path validation. The built login page also passed browser layout and password-visibility checks.
- Read-only checks of the existing Supabase project returned HTTP 200 for Auth and schema. Direct signup, app signup, and Google sign-in remain disabled.

No changes to database policies, auth settings, email, DNS, or service plans. Authenticated production writes were not exercised.
