/**
 * Display formatting shared by the page sections
 * (CommonJS so build scripts could use it too)
 */

/**
 * Formats a phone number while the user types
 * Builds up (XXX) XXX-XXXX from the digits typed so far, at most 10 digits
 * A leading 1 is dropped: US area codes never start with 1, so it's the +1
 * country code (common when phones autofill the number)
 * @param {string} value - Current field value
 * @returns {string} Formatted value, or the input unchanged if it has no digits
 */
function formatPhoneInput (value) {
  // Remove all non-digit characters and the +1 country code,
  // then limit to 10 digits (US phone number)
  const phone = String(value || '').replace(/\D/g, '').replace(/^1/, '').substring(0, 10)

  if (phone.length >= 6) {
    return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`
  }
  if (phone.length >= 3) {
    return `(${phone.substring(0, 3)}) ${phone.substring(3)}`
  }
  if (phone.length > 0) {
    return `(${phone}`
  }
  return String(value || '')
}

/**
 * Splits an email address before the @, so templates can put a <wbr> there
 * and long addresses wrap as "name / @domain" on narrow screens
 * @param {string} email - Email address
 * @returns {string[]} [name, '@domain']
 */
function splitEmail (email) {
  const text = String(email || '')
  const at = text.indexOf('@')
  return at > 0 ? [text.slice(0, at), text.slice(at)] : [text, '']
}

module.exports = { formatPhoneInput, splitEmail }
