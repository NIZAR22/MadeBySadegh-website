/**
 * Build-time helpers that turn site-config.js into the files and tags search
 * engines and link previews read: the <head> values for public/index.html,
 * the JSON-LD block, robots.txt, sitemap.xml and llms.txt.
 *
 * Preview mode (SITE.launchReady not true) keeps an unfinished site out of
 * search engines: a noindex meta tag, a robots.txt that disallows everything,
 * and no JSON-LD, sitemap.xml or llms.txt, so nothing advertises half-written
 * details. The page itself looks exactly the same, so the client can review it.
 *
 * They live here, not inline in vue.config.js, so Jest can test them
 * (tests/unit/build/site-build.spec.js) without running webpack.
 *
 * CommonJS because vue.config.js runs in plain Node.
 */
const { execSync } = require('child_process')

// Value checks shared with the browser code (no Node-only modules there)
const { MARKER_RE, isFilled, isUsableUrl, splitCity, isLaunchReady } = require('../src/utils/config-values')

/**
 * siteUrl with exactly one trailing slash, so joining paths onto it is safe
 * @param {object} site - site-config.js
 * @returns {string}
 */
function baseUrl (site) {
  return String(site.siteUrl || '').replace(/\/+$/, '') + '/'
}

/**
 * Absolute URL for a file in public/, for tags that must not be relative
 * (og:image, JSON-LD image)
 * @param {object} site
 * @param {string} path - e.g. images/og-image.jpg
 * @returns {string}
 */
function absoluteUrl (site, path) {
  return baseUrl(site) + String(path || '').replace(/^\.?\//, '')
}

/**
 * Phone number in E.164-ish form for search engines, from phoneHref
 * ("tel:+15555555555" -> "+15555555555")
 * @param {object} site
 * @returns {string}
 */
function telephone (site) {
  return String(site.phoneHref || '').replace(/^tel:/i, '')
}

/**
 * Schema.org data for search engines (LocalBusiness family).
 *
 * Deliberately never includes aggregateRating or review: Google ignores
 * self-published review markup for local businesses and can treat it as
 * spam (a manual action). The visible review section still shows the ratings.
 *
 * The street address is only included when showStreetAddress is true:
 * service-area businesses that hide their address on Google must not publish
 * it here either.
 *
 * @param {object} site
 * @returns {object}
 */
function structuredData (site) {
  const { locality, region } = splitCity(site.baseCity)
  const address = {
    '@type': 'PostalAddress',
    addressLocality: locality,
    addressRegion: region,
    postalCode: isFilled(site.postalCode) ? site.postalCode : undefined,
    addressCountry: 'US'
  }
  if (site.showStreetAddress && isFilled(site.streetAddress)) {
    address.streetAddress = site.streetAddress
  }

  const data = {
    '@context': 'https://schema.org',
    // Type from config so it matches the licensing status (e.g.
    // HomeAndConstructionBusiness, not GeneralContractor, when unlicensed)
    '@type': isFilled(site.schemaType) ? site.schemaType : 'LocalBusiness',
    name: site.businessName,
    description: site.seo && site.seo.description,
    url: baseUrl(site),
    image: absoluteUrl(site, site.seo && site.seo.ogImage),
    logo: site.logo && site.logo.src ? absoluteUrl(site, site.logo.src) : undefined,
    telephone: telephone(site),
    email: isFilled(site.email) ? site.email : undefined,
    address,
    areaServed: (site.serviceArea || []).map(town => ({
      '@type': 'City',
      name: region ? `${town}, ${region}` : town
    })),
    // Only finished profile links; a placeholder would point search engines
    // at a page that isn't the business
    sameAs: [site.facebookUrl, site.googleReviewsUrl, site.thumbtackUrl].filter(isUsableUrl)
  }
  if (isFilled(site.ownerName)) {
    data.founder = { '@type': 'Person', name: site.ownerName }
  }
  // JSON.stringify drops undefined values, which keeps optional fields out
  return JSON.parse(JSON.stringify(data))
}

/**
 * JSON-LD as a string that is safe inside <script>: "<" is escaped so no
 * config value can close the script tag early
 * @param {object} site
 * @returns {string}
 */
function structuredDataScript (site) {
  return JSON.stringify(structuredData(site)).replace(/</g, '\\u003c')
}

/**
 * Escapes text for an HTML attribute or text node
 * @param {*} value
 * @returns {string}
 */
function escapeHtml (value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Colours must be plain hex so a typo can't inject CSS into the page head
const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
// Google Fonts family names: letters, digits and spaces only
const FONT_RE = /^[A-Za-z0-9 ]+$/

const THEME_KEYS = ['primary', 'onPrimary', 'accent', 'onAccent', 'accentText',
  'background', 'surface', 'text', 'muted']

/**
 * Validates site.theme and throws a readable error for a bad value, so a
 * mistyped colour fails the build instead of producing an unstyled page
 * @param {object} theme
 */
function validateTheme (theme) {
  if (!theme) {
    throw new Error('site-config.js: theme is missing.')
  }
  THEME_KEYS.forEach(key => {
    if (!HEX_RE.test(theme[key] || '')) {
      throw new Error(`site-config.js: theme.${key} must be a hex colour like #1F2328 (got "${theme[key]}").`)
    }
  })
  ;['headingFont', 'bodyFont'].forEach(key => {
    if (!FONT_RE.test(theme[key] || '')) {
      throw new Error(`site-config.js: theme.${key} must be a Google Fonts family name (got "${theme[key]}").`)
    }
  })
}

/**
 * CSS custom properties for the page <head>. Inlined at build time so the
 * very first paint already uses the client's colours and fonts: no flash of
 * the template defaults, and no extra request.
 * @param {object} site
 * @returns {string} e.g. "html:root{--color-primary:#1F2328;...}"
 */
function themeCss (site) {
  const t = site.theme
  validateTheme(t)
  const vars = {
    '--color-primary': t.primary,
    '--color-on-primary': t.onPrimary,
    '--color-accent': t.accent,
    '--color-on-accent': t.onAccent,
    '--color-accent-text': t.accentText,
    '--color-background': t.background,
    '--color-surface': t.surface,
    '--color-text': t.text,
    '--color-muted': t.muted,
    '--font-heading': `'${t.headingFont}', 'Arial Narrow', Arial, sans-serif`,
    '--font-body': `'${t.bodyFont}', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif`
  }
  // html:root (not :root) so these win over the neutral :root fallbacks in
  // src/styles/theme.css, which load later in the page
  return 'html:root{' + Object.keys(vars).map(name => `${name}:${vars[name]}`).join(';') + '}'
}

/**
 * Google Fonts stylesheet URL for the two theme fonts. display=swap shows
 * text in a fallback font straight away instead of hiding it while the font
 * downloads (better for Lighthouse and slow phones).
 * @param {object} site
 * @returns {string}
 */
function googleFontsUrl (site) {
  const { headingFont, bodyFont } = site.theme
  const family = name => name.trim().replace(/ +/g, '+')
  const families = headingFont === bodyFont
    ? [`family=${family(bodyFont)}:wght@400;600;700`]
    : [`family=${family(headingFont)}:wght@500;600;700`, `family=${family(bodyFont)}:wght@400;600;700`]
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}

/**
 * Values public/index.html reads as htmlWebpackPlugin.options.page.*
 * All text is HTML-escaped here so the template can print it as-is.
 *
 * In preview mode, robots is 'noindex, nofollow' (the template prints the
 * meta tag only when it's set) and structuredData is empty (the template then
 * leaves the JSON-LD script out). Title, description and Open Graph tags stay,
 * so a preview link texted to the client still shows a proper card.
 * @param {object} site
 * @returns {object}
 */
function pageHead (site) {
  const launchReady = isLaunchReady(site)
  return {
    launchReady,
    robots: launchReady ? '' : 'noindex, nofollow',
    title: escapeHtml(site.seo.title),
    description: escapeHtml(site.seo.description),
    url: escapeHtml(baseUrl(site)),
    siteName: escapeHtml(site.businessName),
    ogImage: escapeHtml(absoluteUrl(site, site.seo.ogImage)),
    themeColor: escapeHtml(site.theme.primary),
    themeCss: themeCss(site),
    fontsUrl: escapeHtml(googleFontsUrl(site)),
    structuredData: launchReady ? structuredDataScript(site) : '',
    // <noscript> fallback for visitors and crawlers without JavaScript
    noscript: {
      name: escapeHtml(site.businessName),
      h1: escapeHtml(site.hero.h1),
      sub: escapeHtml(site.hero.sub),
      area: escapeHtml(site.serviceAreaSummary),
      phoneHref: escapeHtml(site.phoneHref),
      phoneDisplay: escapeHtml(site.phoneDisplay)
    },
    analyticsId: /^G-[A-Z0-9]+$/.test(site.analyticsId || '') ? site.analyticsId : ''
  }
}

/**
 * robots.txt. Launched: allow everything and point at the sitemap.
 * Preview: disallow everything (and no Sitemap line, since no sitemap.xml
 * is published), so well-behaved crawlers don't even fetch the page.
 * @param {object} site
 * @returns {string}
 */
function robotsTxt (site) {
  if (!isLaunchReady(site)) {
    return 'User-agent: *\nDisallow: /\n'
  }
  return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl(site)}sitemap.xml\n`
}

/**
 * sitemap.xml with the single page; lastmod is the build date
 * @param {object} site
 * @param {Date} [date]
 * @returns {string}
 */
function sitemapXml (site, date = new Date()) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `  <url>\n    <loc>${escapeHtml(baseUrl(site))}</loc>\n    <lastmod>${date.toISOString().slice(0, 10)}</lastmod>\n  </url>\n` +
    '</urlset>\n'
}

/**
 * llms.txt (https://llmstxt.org): a plain summary of the business for AI
 * assistants that answer "who does X near me". Built from the same config so
 * it can't drift from the page.
 * @param {object} site
 * @returns {string}
 */
function llmsTxt (site) {
  const lines = [`# ${site.businessName}`, '', `> ${site.seo.description}`, '']
  if (isFilled(site.industryNoun)) {
    lines.push(`${site.businessName} provides ${site.industryNoun} from ${site.baseCity}.`, '')
  }
  if (site.modules.services) {
    lines.push('## Services', '')
    ;(site.serviceGroups || []).forEach(group => {
      group.items.forEach(item => lines.push(`- ${item.name}: ${item.description}`))
    })
    lines.push('')
  }
  lines.push('## Service area', '', `${site.serviceAreaSummary}: ${(site.serviceArea || []).join(', ')}.`, '')
  lines.push('## Contact', '', `- Phone: ${site.phoneDisplay}`)
  if (isFilled(site.email)) lines.push(`- Email: ${site.email}`)
  if (isFilled(site.hours)) lines.push(`- Hours: ${site.hours}`)
  lines.push(`- Based in: ${site.baseCity}`, '', '## Website', '', `- [Home](${baseUrl(site)})`, '')
  return lines.join('\n')
}

/**
 * The extra files the build writes next to index.html, by file name.
 * Preview builds only get robots.txt (the "Disallow: /" one): a sitemap or
 * llms.txt would invite search engines and AI assistants to read a page
 * that isn't finished.
 * @param {object} site
 * @param {Date} [date] - sitemap lastmod, defaults to now
 * @returns {Object<string, string>}
 */
function searchEngineFiles (site, date) {
  const files = { 'robots.txt': robotsTxt(site) }
  if (isLaunchReady(site)) {
    files['sitemap.xml'] = sitemapXml(site, date)
    files['llms.txt'] = llmsTxt(site)
  }
  return files
}

/**
 * Whether this build runs in the template repo itself, where to-do
 * markers are expected. Uses GITHUB_REPOSITORY in Actions and the git
 * remote on a developer machine.
 * @returns {boolean}
 */
function isTemplateRepo () {
  if (process.env.GITHUB_REPOSITORY) {
    return /\/nizar-starter-site$/i.test(process.env.GITHUB_REPOSITORY)
  }
  try {
    const remote = execSync('git remote get-url origin', { stdio: ['ignore', 'pipe', 'ignore'] }).toString()
    return /\/nizar-starter-site(\.git)?\s*$/i.test(remote)
  } catch (error) {
    return false
  }
}

/**
 * Names of quote-form keys that are still unfinished. A production build
 * with any of these would publish a form that can't send.
 * @param {object} site
 * @returns {string[]}
 */
function missingFormKeys (site) {
  if (!site.modules.quoteForm) return []
  const keys = ['emailjsPublicKey', 'emailjsServiceId', 'emailjsTemplateId', 'recaptchaSiteKey']
  return keys.filter(key => !isFilled(site.quoteForm[key])).map(key => `quoteForm.${key}`)
}

/**
 * Stops a production build whose form keys are unfinished, but only once the
 * site is marked launchReady. A preview build (launchReady false) is let
 * through: the form then shows a "coming soon, call or text" notice from the
 * start and disables its submit button (QuoteForm.vue), so a preview never
 * shows a broken form. The
 * template repo is always let through, since its keys are placeholders on
 * purpose.
 * @param {object} site
 * @param {{ template?: boolean }} [options] - template defaults to isTemplateRepo()
 */
function assertFormKeys (site, options = {}) {
  if (!isLaunchReady(site)) return
  const template = options.template !== undefined ? options.template : isTemplateRepo()
  const missing = missingFormKeys(site)
  if (missing.length && !template) {
    throw new Error(
      `site-config.js: launchReady is true but ${missing.join(', ')} still need real values, so the quote form couldn't send. ` +
      'See SETUP.md, or set launchReady: false to publish as a preview.'
    )
  }
}

module.exports = {
  MARKER_RE,
  isFilled,
  isUsableUrl,
  baseUrl,
  absoluteUrl,
  splitCity,
  structuredData,
  structuredDataScript,
  escapeHtml,
  validateTheme,
  themeCss,
  googleFontsUrl,
  pageHead,
  robotsTxt,
  sitemapXml,
  llmsTxt,
  searchEngineFiles,
  isLaunchReady,
  isTemplateRepo,
  missingFormKeys,
  assertFormKeys
}
