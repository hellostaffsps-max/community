# Gronda-inspired Community — design QA

final result: passed

Reviewed: 2026-11-21. This result covers the local rendered implementation and the specified Gronda-inspired adaptation. No actionable P0/P1/P2 finding remains in the reviewed states. It does not attest to production deployment or a successful live Google OAuth round trip; those are still pending.

## Evidence and scope

The reference is Gronda's actual public web login/discovery and authenticated account, with official native screenshots used for navigation structure. Sources include [Gronda login](https://gronda.com/login), [Gronda](https://gronda.com/), and [the official Google Play listing](https://play.google.com/store/apps/details?id=com.gronda.app&hl=en_US). This adapts the existing Arabic Goat Journey application and real backend rather than claiming complete Gronda feature parity.

Source screenshots are in [docs/screenshots/gronda-reference](docs/screenshots/gronda-reference): login-mobile.jpg, discovery-mobile.jpg, member-profile-mobile.jpg, and login-desktop.jpg. Implementation evidence is in [docs/screenshots/gronda-implementation](docs/screenshots/gronda-implementation).

The source and implementation were assembled into one image and opened together. Final comparison artifacts:

- [Login, source plus revised implementation](docs/screenshots/gronda-implementation/comparison-login-postfix.png): login-mobile.jpg and login-mobile-v4.jpg.
- [Discovery, source plus implementation](docs/screenshots/gronda-implementation/comparison-discovery-final.png): discovery-mobile.jpg and explore-mobile-v2.jpg.
- [Profile, source plus revised implementation](docs/screenshots/gronda-implementation/comparison-profile-postfix.png): member-profile-mobile.jpg and member-mobile-v3.jpg.
- [Owner-account comparison](docs/screenshots/gronda-implementation/comparison-account-final.png): member-profile-mobile.jpg and account-mobile-v2.jpg.
- [Narrow login and profile](docs/screenshots/gronda-implementation/narrow-login-profile-postfix.png): login-320-v4.jpg and member-320-v3.jpg.
- Focused comparisons: [login controls](docs/screenshots/gronda-implementation/focused-login-controls-postfix.png) and [profile identity/actions](docs/screenshots/gronda-implementation/focused-profile-identity-postfix.png). These were also opened to inspect small text and controls.

### Viewports, density and state differences

Mobile source pixels are 375 × 829. Standard implementation pixels are 375 × 844, from the requested 390 × 844 CSS viewport; the browser's vertical scrollbar accounts for the narrower captured content. Final composites preserve original pixels at 1:1, put both 375px-wide images beside each other, and pad the shorter source without stretching it. The 15px height difference is not treated as design drift. Device pixel ratio was not independently measured in this review; no 2× density scaling was applied or inferred.

Narrow implementation captures are 305 × 780 from the requested 320 × 780 viewport. The browser run confirmed client width and scroll width both equal 305 for login/profile and the final signup/settings captures. No horizontal overflow was observed. The narrow screenshots are resilience checks, not pixel-perfect matches to a missing 320px Gronda reference.

Desktop source login is 1280 × 720; implementation login/explore are 1265 × 900 from the requested 1280 × 900 viewport. Desktop v2 captures were inspected for composition and layout, not compared as identical crops or above-the-fold proportions. They precede the final color-only contrast patch; mobile post-fix captures and computed styles verify that shared correction. No additional desktop layout change was made.

The Gronda profile reference shows its signed-in owner's account. The Goat Journey public-profile capture is signed out, while account-mobile-v2.jpg shows its owner settings tab. These states are documented separately; their different actions, sections and counts are not asserted to match. Local member/recipe content is an explicitly synthetic review fixture, never a production publication. Settings recapture focused the display-name field to scroll without editing values.

## Findings and iteration history

1. **P2 — small discovery typography, resolved.** Earlier comparison-discovery-v1.jpg showed undersized labels and metadata. Categories/tabs were increased to 14px, tile headings to 15–16px, supporting discovery text to at least 12px, and bottom navigation labels to 12px. The source and explore-mobile-v2.jpg were opened together in comparison-discovery-final.png; the revised labels fit, the two-column categories remain readable, and desktop explore-desktop-v2.jpg retains a clear grid. No visible collision or clipped navigation remains.

2. **P2 — persistent CAPTCHA block, resolved.** Initial login v1 included an oversized persistent Turnstile block. The implementation now uses official interaction-only appearance with render execution, retaining token validation, expiration and submit gating. Login-mobile-v4.jpg and login-320-v4.jpg show the revised calm form without that persistent block. These images verify the default appearance, not every possible interactive challenge.

3. **P2 — bidirectional editor counters, resolved.** Arabic direction reversed standalone progress counters. Both counters now specify LTR direction. The browser-rendered editor-counter-320-v2.jpg shows the correct step 2 / 4 ordering; root browser checks also verified the counter direction and action-bar bounds. No fixture content was submitted.

4. **P2 — faint normal-sized text, resolved after a second comparison.** Final pre-fix login/profile images exposed low-contrast helper text and placeholders. CSS confirmed #888 on white at approximately 3.54:1, #777 at 4.48:1 and #969691 at 2.97:1. These are below the [4.5:1 minimum for normal text](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Scoped auth/profile text was changed to #6f6f6f, approximately 5.02:1 on white. The same correction covers signup step labels, settings placeholders and the settings counter. No spacing, font size or layout was changed. The browser verified computed RGB(111,111,111); revised login v4/profile v3 were compared against sources in both full and focused composites. The 320px login/profile, signup-320-v3.jpg and account-settings-320-v3.jpg were opened after the fix. No remaining actionable issue was observed in these states.

5. **Earlier verification blocker, resolved.** Browser control recovered. Final captures now cover login, signup, public profile, account/settings, discovery desktop, empty search results, recipe detail/comments, editor counters and privacy. The prior blocked result was not carried forward without this evidence. The latest browser pass reported no console errors or warnings.

Pre-fix contrast evidence remains available as comparison-login-final.png and comparison-profile-final.png. The earlier v1 comparisons remain in the implementation folder. This is a post-fix QA iteration, not a first-pass approval.

## Required fidelity surfaces

- **Fonts and typography:** Goat Journey's Arabic/Latin fonts are intentional. Main headings, input text, category labels and navigation have a coherent hierarchy. The enlarged discovery labels and darker secondary copy address the observed readability issues. Narrow forms and profile actions wrap without horizontal clipping.
- **Spacing and layout rhythm:** The white shell, rounded search, compact filters, photograph-led categories, two mobile grid columns and focused auth/recipe screens preserve the selected browsing structure. The own-profile and public-profile states remain distinct. Desktop screenshots show usable content width and aligned grids; unmatched viewport heights are not used to claim precise fidelity.
- **Colors and tokens:** Goat Journey yellow/charcoal and white surfaces intentionally replace Gronda's branding. Primary controls and selected navigation are visibly distinct. The identified auth/profile contrast issue is corrected and rechecked. This is scoped visual QA, not a claim of complete accessibility conformance.
- **Image quality and assets:** Four original generated coffee editorial photographs were optimized as local WebP assets; they are not copied Gronda imagery. Categories and guides use coherent crops. Real recipes retain their own uploaded covers; missing covers remain explicitly labeled rather than receiving fabricated member photography. Actual Goat Journey logos and Google's original G asset are used; Google asset provenance is recorded in docs/google-signin-branding.md.
- **Copy and content:** Arabic community copy, free registration, honest empty states and editorial guide attribution remain explicit. Local fixture screenshots do not imply real public activity. No fabricated engagement, paid catalog or subscription offer is introduced. Saved intentionally replaces Gronda Messages because messaging is not implemented. One recipe cover and text steps are supported; per-step video/media are outside this scope. Apple remains inactive pending an Apple Developer account.

## Interactions and verification

Browser-tested during this implementation: category filtering; opening a starter guide; preserving recipe continuation through login/forgot/verify/signup links; editor tool and ingredient dropdowns; ingredient addition; navigation through four editor steps; review preserving input; narrow action-bar bounds; focused fields/keyboard-visible focus; account/settings and public profile; recipe detail/comments; privacy; and the final responsive auth states. These checks did not create a production recipe or account.

The 320px privacy, recipe detail/comments and editor-counter captures were inspected as additional implementation states. The file search-empty-desktop-v2.jpg actually captures the empty filtered explore route; it is not mislabeled here as a separate search-route verification.

The root agent's latest local verification record reports:

- 125 full tests passed before the final CSS-only contrast correction.
- TypeScript, the Next production build and the Cloudflare/vinext build passed before that correction.
- 15 local HTTP smoke groups passed with free signup open, covering discovery/search/people continuation, auth gating, cross-origin/unauthenticated writes and invalid media paths.
- Final contrast edits parsed successfully with PostCSS and passed git diff --check.
- Latest browser console errors and warnings were empty; normal text tokens were confirmed as RGB(111,111,111), and narrow views had equal client/scroll widths.

Earlier build warnings were non-fatal: lucide optimization fallback, plugin sourcemaps, ineffective dynamic imports, timing/debugName notices and privacy marked unknown by static route analysis. Production CI will rerun validation. The temporary review route was removed before production builds; review fixture material is local/ignored and is not deployed.

## Remaining release verification

The local design review is passed. Production deployment, exact deployed-revision verification and a real Google OAuth round trip preserving the intended destination are still pending. This report does not represent them as complete. Gronda messaging, video/per-step media, masterclasses and PRO subscriptions remain intentionally outside the implemented scope.
