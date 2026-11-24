# New client checklist

Work through this list top to bottom. Each step says where its details live.

## 1. Create the repo from the template

Click **Use this template → Create a new repository** on `NIZAR22/nizar-starter-site`, or:

```bash
gh repo view NIZAR22/<Client>-website    # must say "not found"; never overwrite an existing repo
gh repo create NIZAR22/<Client>-website --public --template NIZAR22/nizar-starter-site --clone
cd <Client>-website
git checkout -b <client>-site
npm ci
```

- **Public**, because GitHub Pages is free for public repos. The template itself stays private.
- A template copy has a fresh history and no fork link, so the client repo is fully independent.

Add `scripts/blocklist.txt` with **every other client's** business names, phone numbers and domains, one per line (`#` starts a comment). The check fails if any of them appears in this site, which catches copy-paste leaks between clients.

## 2. Fill in `site-config.js`

Replace every `TODO`/`PLACEHOLDER` value, and remove the `// PLACEHOLDER` comments as you go. Things to watch:

- [ ] `businessName` exactly as on Google and Facebook.
- [ ] `phoneDisplay`, `phoneHref` (`tel:+1…`), `smsHref` (`sms:+1…`, or `null` if they don't text).
- [ ] `siteUrl`: `https://nizar22.github.io/<Client>-website/`, with the trailing slash.
- [ ] `seo.title` (about 50–60 characters) and `seo.description` (about 150 characters): service + city + business name.
- [ ] **Licensing:** `isLicensed`, `isInsured`, `licenseNumber`. Leave them `false` / `null` / `''` until the client confirms **in writing**. While `isLicensed` is `false`, the check rejects every `restrictedWords` entry and its plural and `-ed`/`-ing` forms ("contractors", "licensing", "permitted", "plumbing", "electrical", "roofing"…), even in preview.
- [ ] `allowedPhrases`: only for an exact sentence that describes **other people**, not the business, e.g. `'family friends who were contractors'`. Never a single word. The check prints each one on every run, and warns when one is no longer used.
- [ ] Leave `launchReady: false` for now (step 7).
- [ ] `schemaType` matching the licensing status, e.g. `HomeAndConstructionBusiness` rather than `GeneralContractor` for an unlicensed handyman.
- [ ] Reviews: **verbatim only**, copied from the review site. Never write or tidy up review text. Use first name + last initial.
- [ ] `ratings`: the current value and count per source, with the profile URL.
- [ ] `modules`: switch off anything the client has no content for.
- [ ] `nav`: menu labels and icons. Pick icons that suit the trade, e.g. `mdi-mower` for a lawn-care Services entry.
- [ ] `facebookUrl` and `social`: replace the `TODO` placeholder links with the real profiles, or empty them (`''` / `[]`) to hide "Connect With Us" and "Follow Us". Add Instagram and other profiles as more `social` entries.
- [ ] `showStreetAddress`: `false` (usual for service-area businesses) centres the contact map on `baseCity` with no pin on the owner's house, and "Get Directions" never uses the street. `true` pins `streetAddress`, and "Get Directions" routes to it.
- [ ] `googleReviewsUrl` also becomes the "Get Directions" target while the street is hidden. Without it, directions go to `baseCity`.
- [ ] `footerDescription`: one sentence under the business name in the footer.

## 3. Theme colours and contrast

Set `theme` (hex colours, Google Fonts names). The check script tests every text/background pair against WCAG AA (4.5:1) and fails on any that don't pass. To try colours first, use [WebAIM's contrast checker](https://webaim.org/resources/contrastchecker/).

- [ ] Accent buttons use `onAccent` text. A mid-tone accent usually needs dark text.
- [ ] `accentText` is a darker shade of the accent, for links and highlights on light backgrounds.

## 4. Swap the images

All of them go in `public/images/` (icons in `public/`). Export JPEGs at quality ~75 and keep each under 300 KB; the check warns about larger files.

| File | Size (px) | Notes |
|---|---|---|
| `images/logo.svg` (or `.png`) | square, ≥ 256 | Header logo; update `logo.src` if the name changes |
| `favicon.svg` | square | Browser tab icon; simple shapes read best at 16 px |
| `apple-touch-icon.png` | 180 × 180 | Phone home-screen icon |
| `hero.image` | 1920 × 1080 | Darkened behind the headline, so any good photo works |
| `about.photo` | 800 × 1000 | Owner photo, portrait |
| `images/og-image.jpg` | 1200 × 630 | Link previews (Facebook, texts) |
| `images/projects/NN-name-before.jpg` / `-after.jpg` | 1200 × 900 | Same framing before and after; same size for both |

Delete the template's `placeholder-*` images once nothing references them. To make a labelled placeholder for a photo that's still on its way (on Windows):

```powershell
./scripts/make-placeholder.ps1 -Path public/images/projects/01-kitchen-before.jpg -Width 1200 -Height 900 -Label "Kitchen before"
```

Placeholder images carry a hidden marker, so the check fails until they're replaced.

## 5. Quote form backend

Follow **[SETUP.md](SETUP.md) §1** (EmailJS account, template, keys, reCAPTCHA, domain restriction, test). Pick the photo mode in §2: `'sms'` is free; `'emailjs'` needs EmailJS Professional.

## 6. Run the checks

```bash
npm run lint
npm run test:unit
npm run check          # Windows; pwsh scripts/check-site.ps1 elsewhere
```

The check lists every leftover marker, blocklist hit, restricted word, CNAME mismatch and contrast failure, with file and line. It starts by printing the mode (PREVIEW or LAUNCH). Preview with `npm run serve` at 375, 768 and 1280 px wide. Test the menu, slider, filters, form and photo removal with the keyboard only.

## 7. Preview for client approval

The client can see the real site at its real address before everything is finished, then decide whether to go ahead.

1. Keep `launchReady: false`. `TODO`s and placeholder images can stay; the check lists them as **warnings**. Restricted words, blocklist hits, a CNAME mismatch or a contrast failure still **fail**, so fix those first.
2. Optional: `showPreviewBadge: true` adds a small "Preview" pill in the corner. It's off by default so the site looks finished to the client.
3. Merge to `main` and push. Then: **Settings → Pages → Build and deployment → Source: GitHub Actions.** The site goes live at `https://nizar22.github.io/<Client>-website/`.
4. What a preview does automatically:
   - It's kept out of search engines: a `noindex, nofollow` meta tag, a robots.txt with `Disallow: /`, and no JSON-LD, sitemap.xml or llms.txt.
   - If the EmailJS keys aren't set up yet, the top of the form says "Online quotes are coming soon — call or text [phone] and we'll get right back to you.", with Call and Text buttons, as soon as the page loads. The fields stay visible so the client can review them, but the submit button is disabled and reads "Online quotes coming soon". Nothing is sent.
5. Send the client the link and collect their changes.

## 8. Launch

Once the client approves:

- [ ] Replace every remaining `TODO`/`PLACEHOLDER` value and placeholder image.
- [ ] Set up the real EmailJS and reCAPTCHA keys (step 5).
- [ ] Set `launchReady: true` (and `showPreviewBadge` back to `false`).
- [ ] Run `npm run check`. It must say `PASSED in LAUNCH mode`. Every marker, placeholder image and unfinished form key now **fails**, and the build itself stops on unfinished form keys.
- [ ] Push to `main`. The deploy removes `noindex`, publishes the JSON-LD, sitemap.xml and llms.txt, and allows crawling.
- [ ] Send one test quote request through the live form.

## 9. Google Business Profile

- [ ] Ask the client to add you as a **Manager** (Business Profile → ⋮ → Business Profile settings → Managers → Add).
- [ ] Add the website link.
- [ ] Check that the **primary category matches the licensing status** (e.g. "Handyman", not "General contractor", for an unlicensed business).
- [ ] Add the services and some recent project photos.
- [ ] Copy the profile link into `googleReviewsUrl` and the "Ask for reviews" link into `googleWriteReviewUrl`. Then redeploy.

## 10. Facebook

- [ ] Add the website link to the Facebook page (About → Contact info → Website).
- [ ] With the module on, check that the feed loads on the live site. If the page restricts embedding, the fallback card shows instead.

## 11. Hand-off to the client

- [ ] Send the live link and a short note on what the form does and where requests arrive.
- [ ] Send one test request together and confirm they received it.
- [ ] Explain how to ask for Google reviews (the "Leave a review" link).
- [ ] Note what's still pending (e.g. real photos, hours) and when you'll update it.
