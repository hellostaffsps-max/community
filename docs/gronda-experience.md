# Gronda-inspired Goat Journey experience

This change adapts Gronda's photo-led discovery and focused reading patterns to the existing Goat Journey community, retaining the original logo, yellow `#F5DB30`, charcoal `#2F2F2F`, cobalt accents, Arabic RTL layout and locally hosted fonts. Design revision `9444a23` deployed successfully through Cloudflare build `78051f36-71dd-48e9-b0a9-0f645bee821a`, Worker `82bb457d-9394-4c87-b768-86d1f90843fb`. The subsequent Google-discovery fix `5a43e3b` is also deployed: build `3e22c3c1-6853-4e0a-a4ea-802a1e2db973`, Worker `86ad5593-49a8-4b20-8b26-700dda71565d`. Seven live route groups passed and provider discovery returned exactly `['google']`; the real OAuth round trip also passed, preserving the saved-recipes destination and the session after reload.

The reference review used the [official Gronda login](https://gronda.com/login), [Google Play listing and screenshots](https://play.google.com/store/apps/details?id=com.gronda.app&hl=en_US), and [official Chef Page](https://gronda.com/creator/chef-page). The native screenshots show Home, Search, Create, Messages, and Chef Page; recipe steps have a focused header and a separate action bar. The creator-page promotional image shows an avatar, biography, actions, and recipe grid. These are the observed references; an entire native onboarding or creation flow was not reproduced from assumptions.

## Navigation and discovery

| Goat Journey destination | Behavior |
| --- | --- |
| Home — `/explore` | Community recipes, method categories, and clearly attributed starter guides |
| Search — `/search` | Dedicated search entry using the same recipe data and filters |
| Create — `/recipes/new` | Existing structured recipe editor; anonymous visitors continue through login |
| Saved — `/account?tab=saved` | Real personal bookmarks |
| Profile — `/account` | Published recipes, private drafts, saved recipes, and profile settings |

The five-slot mobile navigation keeps creation in the center. **Saved replaces Gronda's Messages destination** because this application has no direct-messaging feature. People discovery remains accessible inside browsing and at `/people`. Following, saving, sharing, search, filters, and pagination use their existing implementations. Recipe and guide reading use a focused layout. Cards use two columns on mobile and three on desktop, with compact titles, creator identities, and brewing methods.

## Content and editorial images

Original editorial images generated for Goat Journey are stored as optimized WebP assets:

- `public/images/guides/v60.webp`
- `public/images/guides/french-press.webp`
- `public/images/guides/aeropress.webp`
- `public/images/guides/espresso.webp`

These illustrate brewing-method categories and the applicable starter guides. The espresso category image does not imply that an espresso guide or member recipe exists. Guides carry a “دليل تحضير” label, Goat Journey attribution, and their actual instructional sources. Member recipe cards display the member's stored image or a branded missing-image placeholder. Gronda screenshots and food imagery are research references, not application content.

The current recipe editor supports **one cover image per recipe** and text instructions; this update does not add per-step photos, video uploads, AI recipe creation, paid classes, or direct messages. There are no fabricated recipes, members, reviews, likes, follower counts, or activity. Empty and out-of-range pages explain their actual state.

## Authentication and access

Registration remains free, with email/password authentication and the existing email confirmation flow. There is no subscription, trial charge or purchase. Google is enabled in Supabase after owner approval, and Google Cloud project `community-514801` was verified as **In production**. Saved branding is Goat Journey Community, with `https://goatlab.my` as the home page, `https://goatlab.my/privacy` as the privacy page, the existing support/contact email, and only the non-sensitive `openid`, `userinfo.email` and `userinfo.profile` scopes. Apple remains inactive pending an Apple Developer account. No provider credentials are stored in the repository.

Live provider discovery initially returned an empty list on `9444a23` because Workers rejected `redirect: "error"`. Fix `5a43e3b` uses `manual` and explicitly rejects 3xx and already-redirected responses. It passed 42 focused auth tests and TypeScript, deployed successfully, and now returns exactly `['google']` on the live app. Browser evidence confirms Google visible and Apple absent in `production-login-mobile.jpg`. The owner then explicitly approved Continue on Google's consent screen. The live flow returned to `https://goatlab.my/account?tab=saved`, and reloading retained the authenticated saved tab and logout control. No profile, recipe or comment was written during the test. Evidence: `production-google-account-mobile.jpg`. The consent screen identifies the Supabase project domain and requests name, profile picture and email only, with the `goatlab.my/privacy` link.

Search filters and intended destinations are retained across the relevant navigation and authentication links. Interactive controls have visible focus states and meaningful labels; mobile search fields and the method selector use 16px text, and primary touch controls are at least 44px high. Fresh search entry can focus the field; filtered result pages do not reopen it automatically.

### Editorial image generation brief

Four original photographs were generated for this task: a V60 pour-over, an espresso setup, a French press, and an upright AeroPress over a cup. The shared direction was realistic coffee photography, warm stone surfaces and restrained yellow linen, with no copied Gronda content, text or logos. The original generated PNGs were resized to 1000px-wide WebP at quality 84 using Sharp. The brief is a provenance summary, not a verbatim export of the generation prompts.

## Local and production verification — 2026-11-21

The final local review passed after typography, CAPTCHA appearance, bidirectional counters and text contrast were corrected. Latest local login captures are `login-mobile-v4.jpg` and `login-320-v4.jpg`; profile uses v3, signup/settings narrow captures use v3, and desktop layout evidence uses v2. Combined source/implementation evidence and its limits are recorded in [design-qa.md](../design-qa.md). Production revision `9444a23` was then checked through live HTML and UI: exploration/search, opening the French Press guide and privacy at 320px. Evidence: `production-explore-mobile.jpg`, `production-guide-mobile.jpg` and `production-privacy-320.jpg` under `docs/screenshots/gronda-implementation/`.