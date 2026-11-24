# Setup: quote form, photos, analytics, GitHub Pages

Everything below ends in a value you paste into `site-config.js`. No keys go in GitHub settings or `.env` files: the EmailJS public key, service ID and template ID, and the reCAPTCHA site key, all ship in the page's JavaScript anyway (that's how EmailJS works), so they live with the rest of the config.

While `launchReady` is `false` (preview), unfinished keys are fine. The form shows a "coming soon, call or text" notice with Call and Text buttons at the top from the moment it loads, its fields stay visible, the submit button is disabled, and EmailJS is never called. Once `launchReady` is `true`, a production build stops with a clear message if any quote-form key is empty or still contains `TODO`. The template repo itself is exempt.

---

## 1. Quote form backend (EmailJS)

EmailJS sends the form as an email from the browser, through the client's own email account. Create **one EmailJS account per client**. Then the client's quota, plan and email history stay separate, and handing the site over is simple.

### 1.1 Create the account and connect the client's email

1. Sign up at [emailjs.com](https://www.emailjs.com/). Use an address you control for the client, or the client's own if they'll manage it.
2. **Email Services → Add New Service → Gmail** (or their provider). Connect the **client's** mailbox, e.g. `client@gmail.com`. Requests are then sent from their account and land in their inbox.
3. Copy the **Service ID** into `site-config.js` → `quoteForm.emailjsServiceId`.

### 1.2 Create the email template

**Email Templates → Create New Template.**

- **To Email:** the client's address, e.g. `client@gmail.com`. This is where requests go. To send to a different inbox later, change it here; no website change is needed.
- **From Name:** `{{from_name}} via website`
- **Reply To:** `{{reply_to}}`, so replying in Gmail goes straight to the customer when they gave an email.
- **Subject:** `New quote request: {{project_type}} in {{city}}`
- **Content** (every variable the form sends):

```
New quote request from the website

Name:              {{from_name}}
Phone:             {{phone_number}}
Email:             {{reply_to}}
Best way to reply: {{preferred_contact}}

City:              {{city}}
Street address:    {{address}}
Project type:      {{project_type}}
Project size:      {{project_size}}
When:              {{timeline}}
Photos attached:   {{photo_count}}

Details:
{{message}}
```

Save the template and copy its **Template ID** into `quoteForm.emailjsTemplateId`.

### 1.3 Public key

**Account → General → Public Key.** Copy it into `quoteForm.emailjsPublicKey`.

### 1.4 Spam protection: reCAPTCHA v2 ("I'm not a robot")

Use the existing reCAPTCHA v2 (checkbox) key registered for `nizar22.github.io`; find it in the [reCAPTCHA admin console](https://www.google.com/recaptcha/admin). Because it's registered for that domain, it **covers every client site served from `nizar22.github.io/<Repo>/`**. You only need a new key (or to add the domain to this one) when a client moves to a **custom domain**.

1. Put the **site key** in `quoteForm.recaptchaSiteKey`.
2. In EmailJS, open the template → **Settings** tab → enable **reCAPTCHA V2 verification** and paste the reCAPTCHA **secret key**. EmailJS then rejects any request without a valid tick, so bots can't use the public key to send mail.
3. For a custom domain: in the [reCAPTCHA admin console](https://www.google.com/recaptcha/admin), add the domain to the key's domain list, or create a new v2 checkbox key with that domain. If it's a new key, update both the site key in config and the secret in EmailJS.

Local development (`npm run serve`) automatically uses Google's public test key, so the form works on `localhost` without touching the real one.

### 1.5 Restrict the account to the client's domain

In EmailJS **Account → Security**:

- Add the client's site origin to the **allowed domains / origins** list (e.g. `https://nizar22.github.io`, plus the custom domain if any). This stops other websites from using the public key. Third-party reviews say this list is only on paid plans; if the client's plan doesn't show it, reCAPTCHA (1.4) is the main protection.
- Leave **"Allow EmailJS API for non-browser applications"** switched **off**.

The site adds two browser-side limits as well: headless browsers are blocked, and each browser can send one request per 10 seconds (`src/main.js`).

### 1.6 Test it

1. `npm run serve`, fill in the form, tick the box and send. The email should arrive in the client's inbox within a minute. Check the Reply-To and every field.
2. Test the error state: temporarily change the template ID to something wrong, send, and check that the red message shows the phone number. Change it back.
3. After deploying, send one real test from the live site on a phone. Then tell the client to expect it.
4. Check **EmailJS → Email History** if something doesn't arrive. The free plan keeps 7 days.

---

## 2. Photos on the quote form (`quoteForm.photoMode`)

| Mode | What visitors see | Cost | Use when |
|---|---|---|---|
| `'off'` | No photo option | – | The business doesn't need photos |
| `'sms'` | "Text photos of your project" button (also on the success screen) | Free | The owner works from their phone (most trades) |
| `'emailjs'` | Add photos / Take a photo, thumbnails with remove (×) | EmailJS **Professional ($15/mo) or higher** | Photos must arrive with the request |

### `'sms'` mode

Needs `smsHref` (e.g. `sms:+13215550000`). The button opens the visitor's messaging app addressed to the business, with `quoteForm.smsPhotoBody` pre-filled so the owner knows which request the photos belong to. Nothing else to set up.

### `'emailjs'` mode

EmailJS limits the size of each request by plan: **Free 50 KB, Personal 500 KB, Professional 2 MB, Business 30 MB**. That counts the whole request, text and photos together. Phone photos are 3–8 MB, so the browser shrinks each photo first:

- `photoMaxEdge: 1280` and `photoQuality: 0.7` give about 150 KB per photo, so 5 photos plus the text fit under 2 MB.
- Re-encoding through a canvas also strips EXIF metadata, including GPS location.
- Before sending, the form measures the whole request against `maxRequestBytes` (1,900,000, leaving room under the 2 MB cap). If it's too big, the form says so and offers the phone number instead of failing.

Setup:

1. Upgrade the client's EmailJS account to **Professional** or higher. On a lower plan, sends with photos will be rejected.
2. In the EmailJS template → **Attachments** tab, add one **Variable Attachment** for each possible photo, up to `maxPhotos` (default 5):

   | Parameter name | Filename | Content type |
   |---|---|---|
   | `photo_1` | `photo-1.jpg` | JPEG |
   | `photo_2` | `photo-2.jpg` | JPEG |
   | … | … | … |
   | `photo_5` | `photo-5.jpg` | JPEG |

   The form sends each photo as a Base64 data URL (`data:image/jpeg;base64,…`), the same format as EmailJS's own `canvas.toDataURL()` example. Only the photos actually attached are sent (`photo_1` … `photo_N`).
3. Set `photoMode: 'emailjs'` and test three sends: **no photos**, **one photo**, and **the maximum number of photos**. EmailJS doesn't document what it does with an attachment parameter that wasn't sent, so confirm that a request with no photos still arrives cleanly on the client's plan.

---

## 3. Analytics (optional)

1. In [Google Analytics](https://analytics.google.com/), create a GA4 property for the client and a **Web** data stream with the site URL.
2. Copy the **Measurement ID** (`G-XXXXXXXXXX`) into `analyticsId`.
3. Leave `analyticsId: ''` to load no analytics at all. The tag is only added when the ID looks like a real GA4 ID.

If the client wants analytics, mention it in their privacy wording. The form's note only covers form details.

---

## 4. GitHub Pages

The deploy workflow (`.github/workflows/deploy.yml`) builds and publishes with the official Pages actions. There's no `gh-pages` branch.

1. The client repo must be **public** (Pages is free for public repos; the template stays private).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main`. The workflow runs lint, unit tests, the leftover check and the build, then deploys. A blocklist hit, a restricted word (while unlicensed), a CNAME mismatch or a failing contrast pair always stops the deploy. `TODO`/`PLACEHOLDER` markers and placeholder images stop it only once `launchReady` is `true`; in preview they're listed as warnings and the site deploys with `noindex`. The Actions log lists each problem with its file and line.
4. The site appears at `https://nizar22.github.io/<Repo-name>/`. `siteUrl` in config must match this exactly, with the trailing slash.

### Custom domain (later)

1. Add a `public/CNAME` file containing just the domain (e.g. `www.example.com`), and set `siteUrl` to `https://www.example.com/`. The check fails if the two don't match.
2. Point the domain's DNS at GitHub Pages and enter the domain under **Settings → Pages → Custom domain**. Tick **Enforce HTTPS** once it's offered.
3. Add the domain to the reCAPTCHA key (1.4) and to EmailJS's allowed origins (1.5).

Relative asset paths (`publicPath: './'`) mean nothing else changes.
