# Template changes made in MadeBySadegh-website

Component changes made here that are meant to go back into `NIZAR22/nizar-starter-site` later. Every new key is **optional**: when it's missing, the component renders exactly as the template does today, so existing client sites are unaffected (with one deliberate exception, marked ⚠ below).

All of these are tested both ways (key present / key missing) in `tests/unit/components/OptionalKeys.spec.js`. The template's existing tests pass unchanged.

## Files to copy into the template

- `src/components/GallerySection.vue`
- `src/components/HeroSection.vue`
- `src/components/QuoteForm.vue`
- `src/components/SiteFooter.vue`
- `src/utils/quoteEmail.js` (new)
- `tests/unit/components/OptionalKeys.spec.js` (new)
- `tests/unit/utils/quoteEmail.spec.js` (new)
- `tests/unit/components/QuoteForm.spec.js` (one test added)

None of them read anything specific to this site.

## Keys

| File | Key | When missing (default) | When set | Why |
|---|---|---|---|---|
| GallerySection.vue | `projects[].url` + `projects[].image` | The project renders as a before/after slider | The project renders as a **portfolio card**: screenshot, title, category, optional `projects[].description`, and a "Visit site" button. Both links open in a new tab (`rel="noopener noreferrer"`). The screenshot link is out of the tab order, so keyboard users get one named link per card. Both keys are needed; with only one, the slider is used. Link cards and sliders can be mixed and share the category filters. | A web/automation business shows live sites, not before/after photos |
| GallerySection.vue | `gallery.title` | "Recent Projects" | Section heading | "Portfolio" etc. |
| GallerySection.vue | `gallery.lead` | "Drag the slider (or use the arrow keys) to compare before and after." | Line under the heading | The slider hint is wrong when there are no sliders |
| HeroSection.vue | `hero.primaryCta` `{ label, href, icon? }` | "Get a Free Quote" accent button to `#quote` (only when the quote form is on) | Replaces that button. It always shows, whatever the modules | Wording other than "free quote" (e.g. "Start a project") |
| HeroSection.vue | `hero.secondaryCta` `{ label, href, icon? }` | "Call (phone)" and "Text Us" outline buttons | **Replaces Call and Text** with one outline button, for a two-button hero. Calling and texting stay available through the floating call button, the drawer's Call Now button and the contact cards. | A second call to action such as "See my work" |
| HeroSection.vue | (incomplete CTA) | n/a | A CTA without both `label` and `href` is ignored, and the default buttons show | A half-filled value never renders an empty or dead button |
| HeroSection.vue | `hero.image` empty | ⚠ **Changed:** the black overlay used to render even with no photo, turning the primary colour almost black | The overlay only renders over a photo; with no photo the hero is the true primary colour | Plain brand-colour heroes. Sites with a photo are unchanged. |
| HeroSection.vue | `hero.pattern` | No pattern | A decorative `<img>` covering the hero behind the text (`alt=""`, `aria-hidden`, no pointer events). Keep the asset itself subtle; the component adds no opacity. | Brand motif without a photo |
| QuoteForm.vue | `quoteForm.title` | "Get a Free Quote" | Section heading | Non-quote businesses |
| QuoteForm.vue | `quoteForm.submitLabel` | "Request My Free Quote" | Submit button text while the form is connected. "Sending…" and the disabled preview label "Online quotes coming soon" are unchanged. | Same |
| QuoteForm.vue | `quoteForm.sizeLabel` | "Project size" | Label of the `projectSizes` field. " (optional)" is always appended, as on the other optional fields. The EmailJS variable is still `project_size`. | Use the field for budget |
| QuoteForm.vue | `quoteForm.comingSoonText` | "Online quotes are coming soon — call or text (phone) and we'll get right back to you." | Replaces that sentence in the preview notice. The notice's Call/Text buttons stay. | Mention email, or other wording |
| SiteFooter.vue | `footerLogo` `{ src, alt? }` | No image in the footer | 96×96 image above the business name in the first column. `alt` defaults to `''` because the name is printed right below it. Use a version of the logo made for dark backgrounds. | Brand badge in the footer |

## Extra EmailJS params (QuoteForm.vue + `src/utils/quoteEmail.js`)

Not a config key: the form now sends four more params **in addition to** the existing ones (`phone_number`, `preferred_contact`, `city`, `address`, `project_size`, `timeline`, `message`, … are all still sent, unchanged), so existing client templates keep working.

| Param | Value |
|---|---|
| `phone` | Same as `phone_number` |
| `submitted_at` | Send time in Eastern time, e.g. `Nov 25, 2026 3:42 PM ET` (DST-aware). The zone is a default argument of `submittedAt()`; make it a config key if a client outside ET ever needs it. |
| `page_url` | `window.location.href` |
| `details_html` | An inline-styled HTML table of every **filled** field that has no param of its own (name, phone, email and project type do). Every value and label is HTML-escaped and line breaks become `<br>`, because the template inserts it with triple braces: `{{{details_html}}}`. |

The table is built from `QUOTE_FIELDS` in `quoteEmail.js`, which is also where the form's empty values now come from. To add a form field: add its entry there and its input in `QuoteForm.vue`; it then appears in the email with no template change.

## Template bug found (not fixed here)

`scripts/check-site.ps1`, `Get-Lines`: `return $lineCache[$path]` unrolls a one-element array, so for a **one-line file** the caller gets a string and `$lines[$i]` is a single character. Result: the blocklist loop crashes (`[System.Char] does not contain a method named 'IndexOf'`), and the marker and restricted-word scans silently check only the first character of the file. Minified one-line SVGs (most logo exports) trigger it.

- Workaround used here: the three one-line SVGs in `public/` were split onto several lines (drawing unchanged).
- Fix for the template: `return ,$lineCache[$path]` (the comma keeps the array), plus a check-site test with a one-line SVG that contains a blocklisted word.

## Not changed, possible later

- **Manifest and extra icon links** (`site.webmanifest` with a 512 px icon, `favicon-32.png`): would need `<link>` tags in `public/index.html`. This site puts `favicon.ico` at the root, where browsers find it without a tag.
- **Disabled-button label in preview** ("Online quotes coming soon") and the quote section's lead ("Tell us about your project and we'll get back to you…") and success-screen line ("Need to reach us sooner?") are still fixed wording. Possible `quoteForm.comingSoonLabel`, `quoteForm.lead`.
- **Pricing module** (`pricing` list of packages): skipped for now.

## Porting checklist

1. Copy the files above into the template on a branch.
2. Add commented examples of the new keys to the template's `site-config.js` (left out, so they stay optional).
3. Document them in README.md (Modules / Layout) and in `prompts/new-client-prompt.md`.
4. `npm run lint`, `npm run test:unit`, `npm run check:template`.
