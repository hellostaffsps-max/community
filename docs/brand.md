# Goat Journey Community identity

The community uses the approved November 2026 Goat Journey identity, copied from the owner's local `goat-journey-lab` project assets. The source project was read only.

| Token | Value | Use |
| --- | --- | --- |
| Yellow | `#F5DB30` | Primary actions, brand accents, selected mobile navigation |
| Charcoal | `#2F2F2F` | Text, dark surfaces, original logo |
| Off-white | `#F5F2E9` | Main canvas |
| Stone | `#A9AAA5` | Neutral borders |
| Cobalt | `#2752D9` | Links, keyboard focus, supporting accents |

Source evidence: `docs/qa/yellow-identity-2026-11-11.md` and `app/brand-tokens.css` in the local Goat Journey Lab export. The older sand/terracotta migration document predates this identity.

Original SVG geometry is preserved. `public/brand/logo.svg` and `logo-yellow.svg` are the existing `logo-jet.svg` and `logo-sand.svg`; the two mark files are the existing head variants. Filenames in the source retain their historical names, but fills use the current palette.

Arabic uses locally hosted IBM Plex Sans Arabic; Latin uses Manrope. The corresponding OFL licenses ship with the font files in `public/fonts/`. The hero photo is the existing `public/landing/drink-1120.webp`, copied as `public/images/iced-coffee.webp`; it is illustrative brand photography, not a community recipe or a member submission.

`/` is the public landing page. `/explore` is the real Supabase-backed recipe browser. Existing root search/filter links redirect to `/explore` with their query, method and page. No sample recipes, members, testimonials or counts were added to production data. Public signup stays disabled, Google stays disabled, and email setup remains deferred.
