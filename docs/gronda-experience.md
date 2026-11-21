# Gronda-inspired Goat Journey experience

This change adapts Gronda's photo-led discovery and focused reading patterns to the existing Goat Journey community. It retains the original Goat Journey logo, yellow `#F5DB30`, charcoal `#2F2F2F`, cobalt accents, Arabic RTL layout, and locally hosted fonts. It is an integration into the existing application and its real data. This document does not attest that the change is deployed to production.

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

Registration remains free, with email/password authentication and the existing email confirmation flow. There is no subscription, trial charge, or purchase in this experience. Social-provider UI and callback handling are prepared, but a button is shown only when the project's provider configuration is enabled and signup is permitted. **Google is enabled in Supabase after owner approval. Google Cloud remains in Testing; consent setup and a live round trip are still pending, and this frontend is not deployed. Apple activation is deferred because the owner does not have the required Apple Developer account.** No provider credentials are included in the repository.

Search filters and intended destinations are retained across the relevant navigation and authentication links. Interactive controls have visible focus states and meaningful labels; mobile search fields and the method selector use 16px text, and primary touch controls are at least 44px high. Fresh search entry can focus the field; filtered result pages do not reopen it automatically.

### Editorial image generation brief

Four original photographs were generated for this task: a V60 pour-over, an espresso setup, a French press, and an upright AeroPress over a cup. The shared direction was realistic coffee photography, warm stone surfaces and restrained yellow linen, with no copied Gronda content, text or logos. The original generated PNGs were resized to 1000px-wide WebP at quality 84 using Sharp. The brief is a provenance summary, not a verbatim export of the generation prompts.
