import {
  structuredData,
  structuredDataScript,
  themeCss,
  googleFontsUrl,
  pageHead,
  robotsTxt,
  sitemapXml,
  llmsTxt,
  searchEngineFiles,
  isLaunchReady,
  missingFormKeys,
  assertFormKeys
} from '../../../build/site-build'
import { makeSite } from '../fixtures/site'

const fs = require('fs')
const path = require('path')
// Same template engine html-webpack-plugin uses for public/index.html
const template = require('lodash/template')

/**
 * Renders public/index.html the way the build does, for a given config
 * @param {object} site
 * @returns {string}
 */
function renderIndex (site) {
  const source = fs.readFileSync(path.resolve(__dirname, '../../../public/index.html'), 'utf8')
  return template(source)({
    BASE_URL: './',
    htmlWebpackPlugin: { options: { page: pageHead(site) } }
  })
}

const preview = overrides => makeSite({ launchReady: false, ...overrides })

describe('structuredData', () => {
  it('uses the @type from config', () => {
    expect(structuredData(makeSite())['@type']).toBe('HomeAndConstructionBusiness')
  })

  it('falls back to LocalBusiness when no type is set', () => {
    expect(structuredData(makeSite({ schemaType: '' }))['@type']).toBe('LocalBusiness')
  })

  it('never emits review or rating markup (Google ignores it for local businesses and may penalise it)', () => {
    const json = JSON.stringify(structuredData(makeSite()))
    expect(json).not.toMatch(/aggregateRating|"review"/i)
  })

  it('leaves the street address out unless showStreetAddress is true', () => {
    expect(structuredData(makeSite()).address.streetAddress).toBeUndefined()
    expect(structuredData(makeSite({ showStreetAddress: true })).address.streetAddress).toBe('1 Example St')
  })

  it('splits baseCity into locality and region and names served cities with the state', () => {
    const data = structuredData(makeSite())
    expect(data.address.addressLocality).toBe('Springfield')
    expect(data.address.addressRegion).toBe('IL')
    expect(data.areaServed[1]).toEqual({ '@type': 'City', name: 'Riverton, IL' })
  })

  it('only links finished profile URLs', () => {
    const data = structuredData(makeSite({ googleReviewsUrl: 'TODO later', thumbtackUrl: '' }))
    expect(data.sameAs).toEqual(['https://www.facebook.com/example'])
  })

  it('escapes "<" so config text cannot close the script tag', () => {
    const script = structuredDataScript(makeSite({ businessName: '</script><b>' }))
    expect(script).not.toContain('</script>')
  })
})

describe('theme', () => {
  it('writes the theme as CSS custom properties', () => {
    const css = themeCss(makeSite())
    expect(css).toContain('--color-primary:#1F2328')
    expect(css).toContain("--font-heading:'Oswald'")
  })

  it('rejects a colour that is not hex, so typos fail the build', () => {
    expect(() => themeCss(makeSite({ theme: { accent: 'red;}' } }))).toThrow(/theme.accent/)
  })

  it('rejects a font name with unexpected characters', () => {
    expect(() => themeCss(makeSite({ theme: { bodyFont: 'Inter;}' } }))).toThrow(/theme.bodyFont/)
  })

  it('builds a Google Fonts URL for both fonts with display=swap', () => {
    const url = googleFontsUrl(makeSite({ theme: { headingFont: 'Open Sans' } }))
    expect(url).toContain('family=Open+Sans')
    expect(url).toContain('family=Inter')
    expect(url).toContain('display=swap')
  })
})

describe('page head and generated files', () => {
  it('HTML-escapes text for the template', () => {
    expect(pageHead(makeSite()).description).toBe('Repairs &amp; more &lt;fast&gt;')
  })

  it('makes the og:image absolute', () => {
    expect(pageHead(makeSite()).ogImage).toBe('https://example.github.io/Example-website/images/og-image.jpg')
  })

  it('only allows a GA4 measurement ID', () => {
    expect(pageHead(makeSite({ analyticsId: 'G-ABC123' })).analyticsId).toBe('G-ABC123')
    expect(pageHead(makeSite({ analyticsId: '"><script>' })).analyticsId).toBe('')
  })

  it('points robots.txt at the sitemap', () => {
    expect(robotsTxt(makeSite())).toContain('Sitemap: https://example.github.io/Example-website/sitemap.xml')
  })

  it('lists the home page in the sitemap with the build date', () => {
    const xml = sitemapXml(makeSite(), new Date('2026-01-02T00:00:00Z'))
    expect(xml).toContain('<loc>https://example.github.io/Example-website/</loc>')
    expect(xml).toContain('<lastmod>2026-01-02</lastmod>')
  })

  it('summarises services, area and contact in llms.txt', () => {
    const text = llmsTxt(makeSite())
    expect(text).toContain('# Example Home Services')
    expect(text).toContain('- Drywall: Patches and texture')
    expect(text).toContain('Springfield, Riverton')
    expect(text).toContain('Phone: (555) 010-0100')
  })
})

describe('launchReady flag', () => {
  it('only counts an explicit true, so a typo or missing value stays a preview', () => {
    expect(isLaunchReady(makeSite())).toBe(true)
    expect(isLaunchReady(makeSite({ launchReady: false }))).toBe(false)
    expect(isLaunchReady(makeSite({ launchReady: 'true' }))).toBe(false)
    const site = makeSite()
    delete site.launchReady
    expect(isLaunchReady(site)).toBe(false)
  })
})

describe('launch mode (launchReady: true)', () => {
  it('has no robots meta tag and includes the JSON-LD', () => {
    const html = renderIndex(makeSite())
    expect(html).not.toMatch(/<meta name="robots"/)
    expect(html).toContain('<script type="application/ld+json">{')
    expect(pageHead(makeSite()).robots).toBe('')
  })

  it('allows crawling and publishes the sitemap and llms.txt', () => {
    const files = searchEngineFiles(makeSite(), new Date('2026-01-02T00:00:00Z'))
    expect(Object.keys(files).sort()).toEqual(['llms.txt', 'robots.txt', 'sitemap.xml'])
    expect(files['robots.txt']).toContain('Allow: /')
    expect(files['robots.txt']).toContain('Sitemap: https://example.github.io/Example-website/sitemap.xml')
  })
})

describe('preview mode (launchReady: false)', () => {
  it('adds a noindex, nofollow meta tag', () => {
    const html = renderIndex(preview())
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">')
  })

  it('leaves the JSON-LD out entirely', () => {
    const html = renderIndex(preview())
    expect(html).not.toContain('application/ld+json')
    expect(pageHead(preview()).structuredData).toBe('')
  })

  it('keeps the title, description and link-preview tags, so the client sees a finished page', () => {
    const html = renderIndex(preview())
    expect(html).toContain('<title>Repairs in Springfield, IL | Example</title>')
    expect(html).toContain('<meta property="og:image" content="https://example.github.io/Example-website/images/og-image.jpg">')
  })

  it('disallows all crawling, with no Sitemap line', () => {
    expect(robotsTxt(preview())).toBe('User-agent: *\nDisallow: /\n')
  })

  it('publishes only robots.txt: no sitemap.xml and no llms.txt', () => {
    expect(Object.keys(searchEngineFiles(preview()))).toEqual(['robots.txt'])
  })
})

describe('form key guard', () => {
  it('lists unfinished keys', () => {
    const site = makeSite({ quoteForm: { emailjsServiceId: 'TODO id', recaptchaSiteKey: '' } })
    expect(missingFormKeys(site)).toEqual(['quoteForm.emailjsServiceId', 'quoteForm.recaptchaSiteKey'])
  })

  it('ignores the keys when the quote form is off', () => {
    expect(missingFormKeys(makeSite({ modules: { quoteForm: false }, quoteForm: { emailjsServiceId: '' } }))).toEqual([])
  })

  it('stops a launch build with unfinished keys', () => {
    const site = makeSite({ quoteForm: { emailjsPublicKey: 'TODO key' } })
    expect(() => assertFormKeys(site, { template: false })).toThrow(/launchReady is true.*emailjsPublicKey/)
  })

  it('lets a launch build with real keys through', () => {
    expect(() => assertFormKeys(makeSite(), { template: false })).not.toThrow()
  })

  it('lets a preview build with unfinished keys through', () => {
    const site = preview({ quoteForm: { emailjsPublicKey: 'TODO key', recaptchaSiteKey: 'TODO key' } })
    expect(() => assertFormKeys(site, { template: false })).not.toThrow()
  })

  it('lets the template repo through even if it were marked launchReady', () => {
    const site = makeSite({ quoteForm: { emailjsPublicKey: 'TODO key' } })
    expect(() => assertFormKeys(site, { template: true })).not.toThrow()
  })
})
