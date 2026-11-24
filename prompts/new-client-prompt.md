# Claude Code prompt: customise a fresh copy of nizar-starter-site

Copy everything below the line into Claude Code, run from inside the new client repo (created from the template as in NEW-CLIENT.md §1). Fill in every `[…]`. Write `none` or `unknown` rather than deleting a line, so nothing is guessed.

---

You're customising this repo, a fresh copy of the private `nizar-starter-site` template, for a new client. The repo is a Vue 2.7 + Vuetify site, and every client-specific value lives in `site-config.js`.

## Rules

1. **Edit only `site-config.js`, files in `public/images/`, the icons in `public/` (`favicon.svg`, `apple-touch-icon.png`) and `scripts/blocklist.txt`.** Don't change components, styles, build files, workflows or tests. If something can't be done through config, stop and tell me instead of editing code.
2. **Reviews are verbatim.** Paste review text exactly as given below. Never write, shorten, fix or paraphrase a review. If a review's text is missing, set its quote to `TODO: paste verbatim review text from <source>` and tell me.
3. **Licensing:** use exactly the flags below. If the business is not licensed, don't describe it with any of the `restrictedWords` anywhere, including meta text and alt text. That also covers plurals and `-ed`/`-ing` forms ("contractors", "licensing", "permitted"), and trade words like "plumbing", "electrical" and "roofing". If verbatim text (a review or the owner's own words) needs such a word to describe *other people*, add that exact phrase to `allowedPhrases` and tell me. Never add a single word there.
4. **Preview first:** keep `launchReady: false` and `showPreviewBadge: false` unless I say otherwise below. The site can then go live for the client's approval with `TODO`s left. Set `launchReady: true` only when I tell you the client approved and every value is real.
5. Anything I haven't provided stays a `TODO …` value, so the leftover check lists it. Don't invent phone numbers, URLs, hours or facts.
6. Images I haven't provided: make labelled placeholders with `scripts/make-placeholder.ps1` at the sizes in NEW-CLIENT.md §4, using the final file names listed below.
7. Work on the branch `[client]-site`. **Don't push, merge or create pull requests.**

## Launch status

- `launchReady`: [false = preview for client approval (default) / true = launch]
- `showPreviewBadge`: [false (default) / true]

## Business facts

- Business name (exactly as on Google/Facebook): [ ]
- Owner name: [ ]
- Tagline: [ ]
- What they do, in a few words (`industryNoun`): [ ]
- Industry icon (Material Design Icons name, e.g. `mdi-toolbox`): [ ]
- Years of experience: [ ]
- Phone (display, e.g. `(321) 555-0000`): [ ]
- Accepts texts? (yes → same number for `smsHref` / no → `null`): [ ]
- Email: [ ]
- Hours: [ ]
- Base city ("City, ST") and ZIP: [ ]
- Show street address? (usually no for service-area businesses) [yes/no], street: [ ]
- Repo name / site URL: `https://nizar22.github.io/[Repo-name]/`
- Page title (about 50–60 characters): [ ]
- Meta description (about 150 characters), or "write one" plus what it must mention: [ ]
- Schema.org type (`LocalBusiness`, `HomeAndConstructionBusiness`, …): [ ]

## Licensing status

- `isLicensed`: [true/false]. Only `true` if the client confirmed it in writing.
- `licenseNumber`: [ ]
- `isInsured`: [true/false/null]. Use `null` if unknown.

## Links and ratings

- Facebook page URL (`facebookUrl`; empty hides the "Connect With Us" button): [ ]
- Social profiles for the footer's Follow Us buttons (`social`: name, URL, `mdi-` icon; empty list hides it): [ ]
- Google Business Profile URL (`googleReviewsUrl`): [ ]
- Google "write a review" URL: [ ]
- Thumbtack (or other) profile URL: [ ]
- Ratings, per source: [source, value, count, URL]

## Service area

- Towns: [ ]
- Summary line (e.g. "Proudly serving all of … County"): [ ]
- Footer description, one sentence (`footerDescription`): [ ]
- Menu icons that suit the trade (`nav`, e.g. `mdi-mower` for Services), or "defaults": [ ]

## Services

Groups, each with items (name, one-line description, optional icon):

[ ]

- Footnote under services (or `none`): [ ]
- "Why choose us" points (icon, title, one sentence) (or `none`): [ ]

## Projects (gallery)

Per project: title, category, final before/after file names (`images/projects/NN-short-name-before.jpg` / `-after.jpg`), alt text describing the job:

[ ]

## About the owner

- Photo file name: [ ]
- Text (paragraphs separated by blank lines): [ ]
- Value badges: [ ]

## Reviews (verbatim only)

Per review: exact text, name as "First L.", source, stars:

[ ]

## Hero

- H1: [ ]
- Subheadline: [ ]
- Credibility points (ratings and licensing are added automatically): [ ]

## Quote form

- Project types (end with "Other"): [ ]
- Project sizes (or `none`): [ ]
- "When do you need it" options (or keep the template's): [ ]
- Success message: [ ]
- Photo mode (`off` / `sms` / `emailjs`): [ ]
- EmailJS public key / service ID / template ID: [ ] (or "not yet", which leaves them as TODO)
- reCAPTCHA site key: [ ] (the shared `nizar22.github.io` key unless a custom domain)

## Theme

- primary / onPrimary: [ ]
- accent / onAccent: [ ]
- accentText: [ ]
- background / surface / text / muted: [ ]
- Heading font / body font (Google Fonts names): [ ]

## Modules on/off

services [ ], serviceArea [ ], gallery [ ], about [ ], reviews [ ], facebookFeed [ ], quoteForm [ ], contact [ ]

## Logo and link-preview image

- Logo: [file provided / make an SVG placeholder described as: …, marked `PLACEHOLDER: replace with client logo`]
- OG image: [file provided / make a 1200×630 placeholder in the theme colours]

## Blocklist

Put these in `scripts/blocklist.txt` (other clients' names, phones, domains): [ ]

## When you're done

1. Run `npm run lint`, `npm run test:unit` and `npm run check` (or `pwsh scripts/check-site.ps1`).
2. Say which mode the check ran in (PREVIEW or LAUNCH). List every remaining failure and every unfinished-marker warning with its file and line, and say which are expected (things I haven't provided yet) and which are mistakes. Fix the mistakes.
3. Confirm there are no restricted-word or blocklist hits. List every `allowedPhrases` entry the check printed, and where it's used.
4. Run `npm run serve` and describe the layout at 375, 768 and 1280 px.
5. **Stop and wait for my review. Don't push.**
