# Google sign-in brand asset

The Google provider button uses the official standard-color gradient Google G from the [Sign in with Google branding guidelines](https://developers.google.com/identity/branding-guidelines). Downloaded on 2026-11-21 from the page’s [Google G icon](https://developers.google.com/static/identity/images/g-logo.png).

- Local file: `public/brand/google-g.png` (200 × 204 pixels; original bytes preserved).
- SHA-256: `d1ce9c2af0b10a7333abc99bc706f9a6a199e5b65bf3e3009624f076b8638e6a`.
- The app displays it at 20px wide with automatic height to preserve its proportions, on a white background, without recoloring, redrawing, filtering, or fading the logo.
- The surrounding button is rendered by application CSS: 1px border, 12px horizontal padding, 10px icon/text gap, and 14px localized action text. The existing locally hosted Arabic/Latin app fonts remain in use.
- The image has empty alternative text because the adjacent action label already names Google. It is decorative within the accessible button name.

Google and the Google logo are trademarks of Google LLC. This third-party sign-in identity is used for its corresponding authentication action under Google’s branding guidance; it is not part of the Goat Journey logo. The asset does not imply Google endorsement. Google branding must continue to follow the linked guidelines.

Provider discovery, signup gates, OAuth requests, and callback handling are unchanged. The Google button appears only when the backend reports it enabled and signup is permitted. Apple remains deferred until its account and provider configuration are available. No provider credentials or secrets are stored with this asset.
