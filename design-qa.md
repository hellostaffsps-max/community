# Gronda-inspired Community — design QA

final result: blocked

## Evidence and scope

Source: authenticated Gronda home/profile, public web search and login, plus official mobile store screenshots. This is an adaptation to the existing Arabic Goat Journey community, with its real backend and own branding. It is not a feature-complete Gronda clone.

Reference files: docs/screenshots/gronda-reference/login-mobile.jpg and discovery-mobile.jpg. Implementation: docs/screenshots/gronda-implementation/login-mobile-v1.jpg and explore-mobile-v1.jpg. Both sides were opened together in comparison-login-v1.jpg and comparison-discovery-v1.jpg, not judged from memory. The source image pixels are 375 × 829; implementation pixels are 375 × 844, captured with a requested 390 × 844 CSS viewport (browser scrollbar/capture differences). The comparison scales both to 390px width, retains aspect ratio, and does not interpret the extra bottom strip as a design difference. These are signed-out web states; the official native navigation is a separate structural reference.

Additional implementation evidence: guide-mobile-v1.jpg; login-320-v1.jpg (requested 320 × 780); editor-step1-mobile-v1.jpg through editor-step4-mobile-v1.jpg; editor-review-320-v1.jpg. All are real browser renders. The editor used a local synthetic fixture, never saved or published. That temporary route was removed before production builds; the fixture source is retained only under ignored .local. Screenshots are local ignored QA artifacts.

## Findings and iteration history

- [P2, fixed in code; post-fix capture pending] Mobile discovery labels and metadata were too small compared with the reference. Categories/tabs were raised to 14px, tile titles to 15–16px, supporting text to at least 12px, and bottom navigation labels to 12px. Browser disconnection prevents validating the updated wrapping at 320/390px.
- [P2, fixed in code; post-fix capture pending] The compact Turnstile widget occupied a large persistent block on the login screen. It now uses official interaction-only appearance with render execution; token validation, expiry and submit gating remain intact. The visible test-only widget in v1 is not evidence of the final state.
- [P2, fixed in code; post-fix capture pending] Arabic bidirectional ordering reversed editor progress counters. Both standalone counters now have dir=ltr.
- [P2, outstanding verification] Updated Google login, account/profile/settings, desktop discovery and the new privacy page still require final browser captures and keyboard/console review. Source and implementation images for these final states have not been compared.

## Required fidelity surfaces

- Typography: own Arabic/Latin brand fonts are intentional. Main heading hierarchy and 16px input text are readable in captured views. Small discovery typography was an actionable mismatch and has been corrected pending recapture.
- Spacing/layout rhythm: white internal shell, compact search, photo categories, two mobile grid columns, focused auth and focused recipe pages follow the selected reference structure. Captured 320px login/editor states had no horizontal overflow. Profile and desktop states remain unverified.
- Colors/tokens: Goat Journey yellow/charcoal, real logo assets and white surfaces replace Gronda identity intentionally. Primary controls remain distinct; final larger text wrapping needs review.
- Images/assets: four original AI-generated coffee editorial photographs were converted to local WebP, not copied from Gronda. Published member content continues to use its real uploaded image; missing images are labeled. The Google G uses Google's original asset, with provenance in docs/google-signin-branding.md.
- Copy/content: Arabic community wording, clearly labeled editorial starter guides, real member data, free signup and honest empty states. No fabricated members, engagement, paid offers or course catalog. Saved replaces Gronda Messages because messaging is not implemented. Apple is prepared in code but deliberately inactive pending an Apple Developer account.

## Interactions and verification

Browser-tested: V60 category filter; opening a starter guide; template continuation through login/forgot/verify/signup links; editor tool and ingredient dropdowns; ingredient addition; navigation across four editor steps; review preserving entered values; 320px action-bar bounds. No production recipe/account was created by these tests.

Code checks: 123 tests in 13 files passed with zero failures/skips; TypeScript passed. Final local HTTP smoke passed 15 groups with free signup open, including search/people continuation with q/page, auth gating, cross-origin writes, unauthenticated writes and invalid media path rejection. After the production type check exposed stricter Cloudflare JSON types, runtime guards and malformed-response tests were added; 41 focused auth tests passed. The Next production build then passed with the temporary /ui-review route absent. The Cloudflare/vinext build also passed (exit 0), with the same expected auth/privacy routes and no ui-review. Non-fatal warnings: lucide optimization fallback, plugin sourcemaps, ineffective dynamic imports, timing/debugName notices, and privacy marked unknown by static route analysis. No deployment was performed.

Final console review and post-fix screenshots are blocked by the browser control service failing repeatedly after user reconnection. Production publication is held pending that verification and completion of Google's consent configuration.

## Implementation checklist

1. Restore browser control and recapture final login/search/profile/detail/privacy at 320/390px plus desktop.
2. Compare revised captures together with their corresponding references; inspect console/keyboard behavior.
3. Publish and verify the final code only after resolving actionable visual findings.
4. Finish Google branding/audience setup and test one real OAuth round trip preserving next.

## Follow-up polish

Gronda's messages, video/per-step media, masterclasses and PRO subscription are not part of this implemented scope. Do not represent them as complete.
