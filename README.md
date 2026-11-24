# nizar-starter-site

A reusable one-page website for local service businesses (handymen, cleaners, landscapers, painters and similar). Each client site is a copy of this template with its own `site-config.js` and images. Nothing client-specific lives anywhere else.

Built with **Vue 2.7 + Vuetify 2.6 + Vue CLI 5**, deployed to **GitHub Pages** by GitHub Actions. The quote form sends email through **EmailJS** with **reCAPTCHA v2**, so there's no server to run.

- New client? Follow **[NEW-CLIENT.md](NEW-CLIENT.md)**.
- Setting up the quote form, analytics or Pages? See **[SETUP.md](SETUP.md)**.
- Customising with Claude Code? Use **[prompts/new-client-prompt.md](prompts/new-client-prompt.md)**.

## How it works

```
site-config.js  ──►  vue.config.js + build/site-build.js  ──►  <head>: title, meta, Open Graph, canonical,
     │                                                          JSON-LD, theme CSS variables, fonts
     │                                                          + robots.txt, sitemap.xml, llms.txt
     └──────────►  src/App.vue and src/components/*  ──────►  every visible section
```

- **One config file.** `site-config.js` holds the business name, contact details, service area, licensing flags, theme, modules, services, projects, reviews and quote-form keys. Components receive it as a `site` prop (defaulting to the real config), so tests can render any variation.
- **Build-time theme.** Colours and fonts from `SITE.theme` are inlined into the page `<head>` as CSS custom properties and fed into the Vuetify theme, so the first paint already uses the client's look. `src/styles/theme.css` only holds neutral fallbacks.
- **Relative paths.** `publicPath: './'` means the same build works at `https://nizar22.github.io/<Repo>/` and on a custom domain.
- **Unfinished values are visible.** Every placeholder contains `TODO` or `PLACEHOLDER`. Placeholder images made by `scripts/make-placeholder.ps1` carry the marker inside the file. `scripts/check-site.ps1` lists all of them.
- **Preview, then launch.** `SITE.launchReady` sets the mode (see below). A preview can go live with markers left, so the client can see it before deciding. Once launched, nothing unfinished gets through.
- **Licensing is opt-in.** "Licensed", "Insured" and the license number only render when `isLicensed` / `isInsured` are `true`. While `isLicensed` is `false`, the check fails on any `restrictedWords` in visible copy, in either mode. That includes plurals and `-ed`/`-ing` forms, so `license` also catches "licensed" and "licensing". Exact phrases in `allowedPhrases` are exempt (e.g. "family friends who were contractors"), and the check prints each one every time it runs.
- **No review markup.** The JSON-LD never includes `aggregateRating` or `review`: Google ignores self-published review markup for local businesses and can treat it as spam.

## Preview mode and launch

| | `launchReady: false` (preview, the default) | `launchReady: true` (launch) |
|---|---|---|
| `TODO` / `PLACEHOLDER` markers, placeholder images | warnings: the deploy still runs | failures: the deploy stops |
| Restricted words, blocklist, CNAME mismatch, contrast | failures | failures |
| Search engines | `<meta name="robots" content="noindex, nofollow">`; robots.txt is `Disallow: /`; no JSON-LD, sitemap.xml or llms.txt | indexable, with JSON-LD, sitemap.xml and llms.txt |
| Quote form with unfinished EmailJS keys | fields stay visible; a notice at the top says "Online quotes are coming soon — call or text [phone] and we'll get right back to you." with Call/Text buttons, and the submit button is disabled ("Online quotes coming soon"). EmailJS is never called | the build stops (keys must be real) |
| "Preview" ribbon | only if `showPreviewBadge: true` (default `false`, so the preview looks finished) | never |

Only an explicit `true` launches. A missing value or a typo stays a preview, which is the safe side: at worst a finished site stays out of Google until you flip the switch.
## Folder layout

```
site-config.js            ← the only file edited per client (plus images)
vue.config.js             build setup; reads site-config.js
build/site-build.js       head tags, JSON-LD, robots/sitemap/llms.txt, form-key guard
public/
  index.html              page shell; every value comes from the config
  favicon.svg, apple-touch-icon.png
  images/                 logo, hero, owner photo, og-image, projects/
src/
  App.vue                 sticky header + icon menu, phone/tablet drawer, floating call button, section order
  components/
    HeroSection.vue       headline, trust line, call/text/quote buttons
    ServicesSection.vue   service groups, footnote, "why choose us"
    ServiceAreaSection.vue
    GallerySection.vue    category filters + BeforeAfterSlider.vue
    AboutSection.vue      owner photo, text, value badges
    ReviewsSection.vue    rating summary per source, review cards, review links
    FacebookFeed.vue      lazy-loaded Facebook Page Plugin with fallback card
    QuoteForm.vue         EmailJS form + PhotoPicker.vue (photo attachments)
    ContactSection.vue    Call Us / Email Us / Based in <city> cards (small map), Connect With Us
    SiteFooter.vue        business + trust line, Quick Contact, Service Area + Follow Us
  utils/                  site.js (derived values), photos.js (resize/compress), format.js
  styles/theme.css        fallback theme variables, buttons, layout helpers, focus styles
scripts/
  check-site.ps1          leftover-content check (run before every push)
  make-placeholder.ps1    labelled placeholder images with a built-in marker
  blocklist.txt           (per client repo, optional) other clients' names/phones/domains
tests/unit/               Jest tests; they use tests/unit/fixtures/site.js, never the real config
.github/workflows/
  check-site.yml          lint + tests + check on every push and pull request
  deploy.yml              lint + tests + check + build + deploy to Pages (main only)
```

## Modules

Switch sections on and off in `SITE.modules`. The menu and the page follow automatically. Menu labels and icons come from `SITE.nav`. Home is always there; Our Work and About appear when their modules are on.

| Module | Section | Also needs |
|---|---|---|
| `services` | Service groups, footnote, "why choose us" | `serviceGroups` |
| `serviceArea` | Town list | `serviceArea` |
| `gallery` | Before/after sliders with category filters | at least one entry in `projects` |
| `about` | Owner photo, text, badges | `about` |
| `reviews` | Rating summaries and review cards | at least one entry in `reviews` |
| `facebookFeed` | Facebook Page Plugin, loaded only when scrolled near | `facebookUrl` |
| `quoteForm` | Quote form | EmailJS + reCAPTCHA keys (SETUP.md) |
| `contact` | Call Us, Email Us and Based in `baseCity` cards, hours, "Connect With Us" | `facebookUrl` for the Facebook button (empty hides it) |

## Layout (matches the reference site)

- **Header:** on phones and tablets (below 768px), a menu button on the left, then the logo and name. It opens a left-side drawer with the name, the tagline, the icon menu and a full-width Call Now button; X, Escape, a link or the scrim closes it. From 768px up, the logo, name and tagline sit on the left and the icon menu on the right, with the section in view underlined. If the menu doesn't fit beside the name, it switches to icons above smaller labels, and only falls back to the menu button if that still doesn't fit. There is no call button in the bar.
- **Floating call button:** round, primary colour, bottom-right. It hides over the quote form and the contact section, and the footer has extra bottom space on phones, so it never covers the submit button or footer text.
- **Contact:** three cards (a row from 960px up). The small map follows `showStreetAddress`:

  | Setting | Map | Get Directions |
  |---|---|---|
  | `showStreetAddress: true` | pins the full street address | directions to the street address |
  | `showStreetAddress: false` | centred on `baseCity` at town zoom, with no pin on a house | `googleReviewsUrl` (the profile has its own Directions), or directions to `baseCity`; never the street |
  | `baseCity` still has `TODO` | the whole US | same rules as above, so the button still shows in the preview |

  The card ends with the map and then the button, as on the reference site. Google's embedded map has its own "Open in Maps" link.

  "Get Directions" always shows under the map. It's the reference site's button: an outlined, large `v-btn` in the primary colour, with the icon on the left. It opens in a new tab.

- **Footer:** the business name, trust line (the licensing claim appears only when the flags allow it) and `footerDescription`; Quick Contact; Service Area plus Follow Us, which shows round buttons built from `SITE.social` (an empty list hides it). The bottom row has the copyright on the left and `serviceAreaSummary` on the right.
- **Placeholder links:** `facebookUrl` and `SITE.social` ship with `TODO` placeholder URLs, so the template and previews show those sections. The check warns about them in preview and fails at launch. Empty values hide the sections.

Quote-form photos are set by `quoteForm.photoMode`:

- `'off'`: no photo option.
- `'sms'`: a "Text photos of your project" button that opens the visitor's messaging app with a pre-filled note. It's free.
- `'emailjs'`: photos are resized to `photoMaxEdge` px at `photoQuality` JPEG in the browser (which also strips GPS/EXIF) and sent as attachments. This needs **EmailJS Professional or higher** (see SETUP.md).

## Run it locally

Needs Node.js 22.

```bash
npm ci            # install exactly what package-lock.json lists
npm run serve     # http://localhost:8080 (uses Google's reCAPTCHA test key)
npm run lint
npm run test:unit
npm run check     # leftover-content check (Windows PowerShell); in the template: npm run check:template
npm run build     # production build into dist/
```

`npm run build` prints which mode it's building. With `launchReady: false` it always succeeds, even with unfinished quote-form keys. With `launchReady: true` it stops if any key is still unfinished, except in the template repo itself, where the keys are placeholders on purpose.

On macOS or Linux, run the check with `pwsh scripts/check-site.ps1`.

## Updating client sites from the template

Client repos made with "Use this template" have no link back to it. To bring in a template fix, copy the changed files (everything except `site-config.js`, `public/images/`, `scripts/blocklist.txt` and the icons) into the client repo. Then run lint, tests and the check before pushing.
