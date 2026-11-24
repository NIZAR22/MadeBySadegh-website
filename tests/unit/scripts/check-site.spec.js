/**
 * @jest-environment node
 */
/**
 * Runs the real scripts/check-site.ps1 against small fixture repos in a temp
 * folder, so the preview/launch modes, the restricted-word variants and the
 * allowed phrases are tested end to end rather than re-implemented here.
 *
 * Needs PowerShell: Windows PowerShell 5.1 on Windows (always installed) and
 * pwsh elsewhere (preinstalled on GitHub's Ubuntu runners). Each run takes a
 * second or two, so several cases share one fixture and one run.
 */
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const SCRIPT = path.resolve(__dirname, '../../../scripts/check-site.ps1')
const SHELL = process.platform === 'win32' ? 'powershell' : 'pwsh'
// Marker built from pieces, matching how the other specs write it
const MARK = 'TO' + 'DO'
// ANSI colour codes (ESC [ ... m) that pwsh may add to Write-Host output.
// Built from the character code because ESLint forbids a literal control
// character in a regular expression.
const ANSI_RE = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g')

jest.setTimeout(120000)

/**
 * A minimal site-config.js. Keys are unquoted on purpose: the check finds
 * config lines (restrictedWords, allowedPhrases, theme) by "key:".
 * @param {object} o - values to change from a finished, unlicensed preview
 * @returns {string}
 */
function config (o = {}) {
  const v = {
    launchReady: false,
    isLicensed: false,
    allowedPhrases: '[]',
    businessName: 'Example Home Services',
    copy: ['Repairs done right.'],
    siteUrl: 'https://example.github.io/Example-website/',
    accent: '#C8873A',
    publicKey: 'pk_real',
    facebookUrl: 'https://www.facebook.com/example',
    social: "[{ name: 'Facebook', url: 'https://www.facebook.com/example', icon: 'mdi-facebook' }]",
    ...o
  }
  return [
    'module.exports = {',
    `  launchReady: ${v.launchReady},`,
    '  showPreviewBadge: false,',
    `  businessName: '${v.businessName}',`,
    `  isLicensed: ${v.isLicensed},`,
    "  restrictedWords: ['contractor', 'license', 'plumber', 'plumbing', 'permit'],",
    `  allowedPhrases: ${v.allowedPhrases},`,
    `  siteUrl: '${v.siteUrl}',`,
    "  smsHref: 'sms:+15550100100',",
    `  facebookUrl: '${v.facebookUrl}',`,
    `  social: ${v.social},`,
    // One copy line per entry, so each gets its own line number
    ...v.copy.map((text, i) => `  copy${i + 1}: '${text}',`),
    `  theme: { primary: '#1F2328', onPrimary: '#FFFFFF', accent: '${v.accent}', onAccent: '#1F2328', accentText: '#8F5A22', background: '#F7F4EF', surface: '#FFFFFF', text: '#1F2328', muted: '#5B616B' },`,
    '  modules: { gallery: false, quoteForm: true },',
    '  projects: [],',
    `  quoteForm: { emailjsPublicKey: '${v.publicKey}', emailjsServiceId: 'service_real', emailjsTemplateId: 'template_real', recaptchaSiteKey: 'site_key_real', photoMode: 'off', maxPhotos: 5 }`,
    '}',
    ''
  ].join('\n')
}

/**
 * Writes a fixture repo and runs the check on it
 * @param {{ config: string, vue?: string, html?: string, placeholderImage?: boolean, blocklist?: string, cname?: string }} files
 * @returns {{ code: number, out: string }}
 */
function runCheck (files) {
  const root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'check-site-')))
  try {
    fs.mkdirSync(path.join(root, 'src', 'components'), { recursive: true })
    fs.mkdirSync(path.join(root, 'public', 'images'), { recursive: true })
    fs.mkdirSync(path.join(root, 'scripts'), { recursive: true })
    fs.writeFileSync(path.join(root, 'site-config.js'), files.config)
    fs.writeFileSync(path.join(root, 'src', 'components', 'Copy.vue'),
      `<script>\nexport default {}\n</script>\n\n<template>\n  <p>${files.vue || 'Friendly local service.'}</p>\n</template>\n`)
    fs.writeFileSync(path.join(root, 'public', 'index.html'),
      `<!DOCTYPE html>\n<html>\n<head>\n<meta name="description" content="${files.html || 'Local repairs'}">\n</head>\n</html>\n`)
    if (files.placeholderImage) {
      // The check looks for the marker bytes make-placeholder.ps1 embeds
      fs.writeFileSync(path.join(root, 'public', 'images', 'hero.jpg'), Buffer.from('\xff\xd8 PLACEHOLDER image', 'latin1'))
    }
    if (files.blocklist) fs.writeFileSync(path.join(root, 'scripts', 'blocklist.txt'), files.blocklist)
    if (files.cname) fs.writeFileSync(path.join(root, 'public', 'CNAME'), files.cname)

    const args = ['-NoProfile', '-NonInteractive']
    if (process.platform === 'win32') args.push('-ExecutionPolicy', 'Bypass')
    args.push('-File', SCRIPT, '-Root', root)
    const result = spawnSync(SHELL, args, { encoding: 'utf8' })
    if (result.error) throw result.error
    // Drop colour codes (pwsh may emit them) and normalise line endings
    const out = (result.stdout + result.stderr).replace(ANSI_RE, '').replace(/\r\n/g, '\n')
    return { code: result.status, out }
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

const lines = (out, kind) => out.split('\n').filter(line => line.trim().startsWith(kind))

describe('check-site.ps1 preview mode (launchReady: false)', () => {
  let run
  beforeAll(() => {
    run = runCheck({
      config: config({ copy: [`${MARK} write the about text`] }),
      placeholderImage: true
    })
  })

  it('reports markers and placeholder images as warnings and passes', () => {
    expect(run.out).toContain('Mode: PREVIEW')
    expect(lines(run.out, 'WARN').join('\n')).toMatch(/site-config\.js:\d+ {2}unfinished:/)
    expect(lines(run.out, 'WARN').join('\n')).toContain('public/images/hero.jpg  placeholder image')
    expect(lines(run.out, 'FAIL')).toEqual([])
    expect(run.out).toContain('check-site: PASSED in PREVIEW mode')
    expect(run.code).toBe(0)
  })
})

describe('check-site.ps1 launch mode (launchReady: true)', () => {
  let run
  beforeAll(() => {
    run = runCheck({
      config: config({ launchReady: true, publicKey: '', copy: [`${MARK} write the about text`] }),
      placeholderImage: true
    })
  })

  it('fails on markers, placeholder images and unfinished form keys', () => {
    const fails = lines(run.out, 'FAIL').join('\n')
    expect(run.out).toContain('Mode: LAUNCH')
    expect(fails).toMatch(/site-config\.js:\d+ {2}unfinished:/)
    expect(fails).toContain('public/images/hero.jpg  placeholder image')
    expect(fails).toMatch(/quoteForm\.emailjsPublicKey needs a real value before launch/)
    expect(run.out).toContain('check-site: FAILED in LAUNCH mode')
    expect(run.code).toBe(1)
  })
})

describe('check-site.ps1 restricted words (unlicensed, preview)', () => {
  let run
  beforeAll(() => {
    run = runCheck({
      config: config({
        copy: [
          'Contractors on call',
          'All work permitted',
          'I learned from family friends who were contractors.',
          'Licensing questions welcome'
        ],
        allowedPhrases: "['family friends who were contractors', 'an unused allowed phrase']"
      }),
      vue: 'Ask about our plumbing work.',
      html: 'Licensed and ready'
    })
  })

  const fails = () => lines(run.out, 'FAIL').join('\n')

  it('fails even in preview mode', () => {
    expect(run.out).toContain('check-site: FAILED in PREVIEW mode')
    expect(run.code).toBe(1)
  })

  it('catches plurals and -ed/-ing forms, case-insensitively', () => {
    expect(fails()).toContain("restricted word 'Contractors'")
    expect(fails()).toContain("restricted word 'permitted'")
    expect(fails()).toContain("restricted word 'Licensing'")
  })

  it('checks component templates and public HTML too, with file and line', () => {
    expect(fails()).toContain("src/components/Copy.vue:6  restricted word 'plumbing'")
    expect(fails()).toContain("public/index.html:4  restricted word 'Licensed'")
  })

  it('exempts an allowed phrase and prints where it was used', () => {
    expect(fails()).not.toContain('family friends')
    expect(run.out).toMatch(/ALLOW 'family friends who were contractors' {2}used at site-config\.js:\d+/)
    // Exactly the three real hits in config, not the allowed sentence
    expect(lines(run.out, 'FAIL').filter(line => line.includes('site-config.js') && line.includes('restricted')).length).toBe(3)
  })

  it('warns about an allowed phrase nothing uses', () => {
    expect(run.out).toContain("ALLOW 'an unused allowed phrase'  (not used anywhere)")
    expect(lines(run.out, 'WARN').join('\n')).toContain("allowedPhrases entry 'an unused allowed phrase' isn't used anywhere")
  })
})

describe('check-site.ps1 checks that fail in every mode', () => {
  let run
  beforeAll(() => {
    run = runCheck({
      config: config({
        businessName: 'Other Client Co',
        accent: '#333333', // charcoal onAccent text on charcoal: fails contrast
        allowedPhrases: "['contractors']"
      }),
      blocklist: '# other clients\nOther Client Co\n',
      cname: 'www.someone-else.com\n'
    })
  })

  it('fails on a blocklist hit, a CNAME mismatch, low contrast and a one-word allowed phrase', () => {
    const fails = lines(run.out, 'FAIL').join('\n')
    expect(fails).toContain("blocklisted text 'Other Client Co'")
    expect(fails).toContain("CNAME is 'www.someone-else.com'")
    expect(fails).toMatch(/theme\.onAccent \(#1F2328\) on theme\.accent \(#333333\) is [\d.]+:1, below WCAG AA/)
    expect(fails).toContain("allowedPhrases entry 'contractors' is a single word")
    expect(run.out).toContain('Mode: PREVIEW')
    expect(run.code).toBe(1)
  })
})

describe('check-site.ps1 Facebook and social links', () => {
  it('accepts placeholder links in preview, reporting their markers as warnings', () => {
    const run = runCheck({
      config: config({
        facebookUrl: `https://www.facebook.com/${MARK}-page`,
        social: `[{ name: 'Facebook', url: 'https://www.facebook.com/${MARK}-page', icon: 'mdi-facebook' }]`
      })
    })
    const warns = lines(run.out, 'WARN').join('\n')
    expect(warns).toMatch(/site-config\.js:\d+ {2}unfinished: facebookUrl:/)
    expect(warns).toMatch(/site-config\.js:\d+ {2}unfinished: social:/)
    expect(lines(run.out, 'FAIL')).toEqual([])
    expect(run.code).toBe(0)
  })

  it('fails on links that are not http(s) URLs, and warns about odd icons and half-filled entries', () => {
    const run = runCheck({
      config: config({
        facebookUrl: 'facebook.com/example',
        social: "[{ name: 'Instagram', url: 'instagram.com/example', icon: 'instagram' }, { name: 'YouTube', url: '' }]"
      })
    })
    const fails = lines(run.out, 'FAIL').join('\n')
    const warns = lines(run.out, 'WARN').join('\n')
    expect(fails).toContain("facebookUrl 'facebook.com/example' must start with https://")
    expect(fails).toContain("social[1] ('Instagram') url 'instagram.com/example' must start with https://")
    expect(warns).toContain("social[1] ('Instagram') icon 'instagram' isn't a Material Design Icons name")
    expect(warns).toContain('social[2] needs both a name and a url')
    expect(run.code).toBe(1)
  })

  it('allows an empty facebookUrl and an empty social list (both just hide their buttons)', () => {
    const run = runCheck({ config: config({ facebookUrl: '', social: '[]' }) })
    expect(lines(run.out, 'FAIL')).toEqual([])
    expect(run.code).toBe(0)
  })
})

describe('check-site.ps1 licensed business', () => {
  it('allows the licensing words once isLicensed is true', () => {
    const run = runCheck({ config: config({ isLicensed: true, copy: ['Licensed contractor, permits handled'] }) })
    expect(lines(run.out, 'FAIL')).toEqual([])
    expect(run.code).toBe(0)
  })
})
