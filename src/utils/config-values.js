/**
 * Small checks on site-config.js values, shared by the build
 * (build/site-build.js, in Node) and the page (src/utils/site.js, in the
 * browser). CommonJS so both can load it; it must not use Node-only modules.
 */

// Words that mark a config value as unfinished. Built from pieces so this
// file doesn't trip the leftover check (scripts/check-site.ps1) it supports.
const MARKER_RE = new RegExp('\\b(' + ['TO' + 'DO', 'PLACE' + 'HOLDER'].join('|') + ')\\b')

/**
 * Whether a config value is a real, finished string (not empty and without
 * a to-do marker). Unfinished links are treated as missing so the site never
 * points at a wrong or half-typed address.
 * @param {*} value
 * @returns {boolean}
 */
function isFilled (value) {
  return typeof value === 'string' && value.trim() !== '' && !MARKER_RE.test(value)
}

/**
 * Whether a value is a finished http(s) URL
 * @param {*} value
 * @returns {boolean}
 */
function isUsableUrl (value) {
  return isFilled(value) && /^https?:\/\//i.test(value)
}

/**
 * Splits "Springfield, IL" into locality and region. The region is whatever
 * follows the last comma, so "Winston-Salem, NC" and "St. Louis, MO" both work.
 * @param {string} baseCity
 * @returns {{ locality: string, region: string }}
 */
function splitCity (baseCity) {
  const text = String(baseCity || '')
  const comma = text.lastIndexOf(',')
  if (comma === -1) {
    return { locality: text.trim(), region: '' }
  }
  return { locality: text.slice(0, comma).trim(), region: text.slice(comma + 1).trim() }
}

/**
 * Whether the site is finished and may be indexed by search engines.
 *
 * Only an explicit true counts. Anything else (false, missing, a typo) means
 * preview mode: the safe default, because a preview that's accidentally
 * indexed shows unfinished text in Google, while a finished site left in
 * preview just stays out of search until someone flips the switch.
 * @param {object} site - site-config.js
 * @returns {boolean}
 */
function isLaunchReady (site) {
  return !!site && site.launchReady === true
}

/**
 * Whether the quote form's EmailJS keys are all real values. While any is
 * empty or still marked unfinished, the page never calls EmailJS and the
 * form tells visitors to call or text instead.
 * @param {object} site
 * @returns {boolean}
 */
function emailjsKeysFilled (site) {
  const q = (site && site.quoteForm) || {}
  return ['emailjsPublicKey', 'emailjsServiceId', 'emailjsTemplateId'].every(key => isFilled(q[key]))
}

module.exports = { MARKER_RE, isFilled, isUsableUrl, splitCity, isLaunchReady, emailjsKeysFilled }
