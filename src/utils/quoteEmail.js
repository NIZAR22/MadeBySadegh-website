/**
 * What the quote form sends to EmailJS beyond its original one-param-per-
 * field list: a ready-made HTML table of the request's details, the time it
 * was sent and the page it came from (see TEMPLATE-CHANGES.md).
 *
 * The table is built from QUOTE_FIELDS, so a field added to that list (and
 * to the form) shows up in the email with no template change.
 */

/**
 * Every value the quote form collects, in the order the email lists them.
 *   key     the property in QuoteForm's `form` data
 *   label   how the email names it: a string, or a function of the site
 *           config for labels the config can change
 *   initial the value of an empty form (default '')
 *   param   the field already has its own EmailJS param (from_name, reply_to,
 *           phone, project_type), shown at the top of the email, so it isn't
 *           repeated in the details table
 */
export const QUOTE_FIELDS = [
  { key: 'name', label: 'Name', param: 'from_name' },
  { key: 'phone', label: 'Phone', param: 'phone' },
  { key: 'email', label: 'Email', param: 'reply_to' },
  { key: 'contactMethod', label: 'Best way to reach you', initial: 'Call' },
  { key: 'city', label: 'City' },
  { key: 'address', label: 'Street address' },
  { key: 'projectType', label: 'Project type', param: 'project_type' },
  { key: 'projectSize', label: site => (site.quoteForm && site.quoteForm.sizeLabel) || 'Project size' },
  { key: 'timeline', label: 'When they need it done' },
  { key: 'message', label: 'Project details' }
]

// Inline styles: email clients ignore <style> blocks and classes
const FONT = 'font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.45;'
const LABEL_STYLE = `${FONT}color:#5B616B;padding:6px 16px 6px 0;vertical-align:top;white-space:nowrap;`
const VALUE_STYLE = `${FONT}color:#0F2A44;padding:6px 0;vertical-align:top;`

/**
 * Escapes text for HTML. The EmailJS template inserts details_html with
 * triple braces (unescaped), so every user value must go through this.
 * @param {*} value
 * @returns {string}
 */
export function escapeHtml (value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * @param {*} value
 * @returns {boolean} true for something worth printing (not empty or blank)
 */
function hasValue (value) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

/**
 * The details table for the notification email: one row per filled field
 * that doesn't have its own param. Values are escaped, line breaks kept.
 * @param {object} form - QuoteForm's form data
 * @param {object} site - site config (for config-dependent labels)
 * @param {Array} [fields] - field list, QUOTE_FIELDS by default
 * @returns {string} HTML, or '' when there's nothing to list
 */
export function detailsHtml (form, site, fields = QUOTE_FIELDS) {
  const rows = fields
    .filter(field => !field.param && hasValue(form[field.key]))
    .map(field => {
      const label = typeof field.label === 'function' ? field.label(site) : field.label
      const value = escapeHtml(String(form[field.key]).trim()).replace(/\r?\n/g, '<br>')
      return `<tr><td style="${LABEL_STYLE}">${escapeHtml(label)}</td><td style="${VALUE_STYLE}">${value}</td></tr>`
    })
  if (!rows.length) return ''
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${rows.join('')}</table>`
}

/**
 * Empty form values, from QUOTE_FIELDS, plus the honeypot
 * @returns {object}
 */
export function emptyQuoteForm () {
  const form = {}
  QUOTE_FIELDS.forEach(field => { form[field.key] = field.initial || '' })
  // Honeypot: hidden from people, but bots that fill every field fill it
  form.website = ''
  return form
}

/**
 * When the request was sent, in the business's time zone,
 * e.g. "Nov 25, 2026 3:42 PM ET"
 * @param {Date} [date]
 * @param {string} [timeZone] - IANA zone
 * @param {string} [zoneLabel] - printed after the time
 * @returns {string}
 */
export function submittedAt (date = new Date(), timeZone = 'America/New_York', zoneLabel = 'ET') {
  const parts = {}
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).formatToParts(date).forEach(part => { parts[part.type] = part.value })
  return `${parts.month} ${parts.day}, ${parts.year} ${parts.hour}:${parts.minute} ${parts.dayPeriod.toUpperCase()} ${zoneLabel}`
}
