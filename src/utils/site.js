/**
 * Derived values the page sections compute from site-config.js.
 *
 * Every function takes the config object as an argument (instead of
 * importing it) so components and tests can pass any config: the real one,
 * or a fixture that turns modules and licensing flags on and off.
 */
import { isFilled, isUsableUrl, splitCity, isLaunchReady, emailjsKeysFilled } from './config-values'

export { isFilled, isUsableUrl, splitCity, isLaunchReady, emailjsKeysFilled }

/**
 * Whether to show the small "Preview" ribbon: only on a preview build
 * (launchReady not true) and only when showPreviewBadge is exactly true, so
 * by default a preview looks finished when the client sees it, and a
 * launched site can never show the ribbon by mistake.
 * @param {object} site
 * @returns {boolean}
 */
export function previewBadgeOn (site) {
  return !isLaunchReady(site) && site.showPreviewBadge === true
}

/**
 * Whether a module is switched on in config.modules
 * @param {object} site
 * @param {string} name - e.g. 'gallery'
 * @returns {boolean}
 */
export function moduleOn (site, name) {
  return !!(site.modules && site.modules[name])
}

/**
 * The licensing/insurance claim the page may make, or '' for none.
 *
 * These words are legally sensitive for trades (an unlicensed business
 * advertising as licensed or as a contractor can be fined), so they only
 * appear when the config flags say so explicitly. isInsured must be exactly
 * true: null means "not confirmed yet" and shows nothing.
 *
 * @param {object} site
 * @returns {string} 'Licensed & Insured', 'Licensed', 'Insured' or ''
 */
export function licensingClaim (site) {
  const licensed = site.isLicensed === true
  const insured = site.isInsured === true
  if (licensed && insured) return 'Licensed & Insured'
  if (licensed) return 'Licensed'
  if (insured) return 'Insured'
  return ''
}

/**
 * Footer text with the license number, only for a licensed business that
 * has entered its number
 * @param {object} site
 * @returns {string}
 */
export function licenseNumberText (site) {
  return site.isLicensed === true && isFilled(site.licenseNumber)
    ? `License #${site.licenseNumber}`
    : ''
}

/**
 * Rating summaries that have a value to show
 * @param {object} site
 * @returns {Array<{source: string, value: string, count: number, url: string}>}
 */
export function ratingsToShow (site) {
  return (site.ratings || []).filter(rating => isFilled(String(rating.value || '')) && isFilled(rating.source))
}

/**
 * The trust line under the hero headline: the configured points, then the
 * licensing claim (only when allowed), then one "4.6★ Google" per rating
 * @param {object} site
 * @returns {string[]}
 */
export function trustItems (site) {
  const items = [...((site.hero && site.hero.trustItems) || [])]
  const claim = licensingClaim(site)
  if (claim) items.push(claim)
  ratingsToShow(site).forEach(rating => items.push(`${rating.value}★ ${rating.source}`))
  return items
}

/**
 * The "why choose us" points, with a licensing point added only when the
 * flags allow it
 * @param {object} site
 * @returns {Array<{icon: string, title: string, description: string}>}
 */
export function whyChooseUs (site) {
  const points = [...(site.whyChooseUs || [])]
  const claim = licensingClaim(site)
  if (claim) {
    points.unshift({
      icon: 'mdi-shield-check-outline',
      title: claim,
      description: `${claim} for your peace of mind.`
    })
  }
  return points
}

/**
 * Whether the gallery has something to show
 * @param {object} site
 * @returns {boolean}
 */
export function galleryOn (site) {
  return moduleOn(site, 'gallery') && (site.projects || []).length > 0
}

/**
 * Whether the Facebook feed can be shown (module on and a finished URL)
 * @param {object} site
 * @returns {boolean}
 */
export function facebookFeedOn (site) {
  return moduleOn(site, 'facebookFeed') && isUsableUrl(site.facebookUrl)
}

/**
 * Fallback labels and icons for menu entries that site-config.js `nav`
 * leaves out, so an older config (or a test fixture) without `nav` still gets
 * a complete menu. All generic: the one trade-specific entry, Services, falls
 * back to the config's own industryIcon rather than a hard-coded trade icon.
 */
const NAV_DEFAULTS = {
  home: { label: 'Home', icon: 'mdi-home' },
  services: { label: 'Services', icon: '' },
  projects: { label: 'Our Work', icon: 'mdi-image-multiple' },
  about: { label: 'About', icon: 'mdi-account' },
  reviews: { label: 'Reviews', icon: 'mdi-star' },
  quote: { label: 'Free Quote', icon: 'mdi-clipboard-text-outline' },
  contact: { label: 'Contact', icon: 'mdi-phone' }
}

/**
 * Label and icon for one menu entry: site-config.js nav[key] first, then
 * the defaults above
 * @param {object} site
 * @param {string} key - e.g. 'services'
 * @returns {{ title: string, icon: string }}
 */
function navEntry (site, key) {
  const fromConfig = (site.nav && site.nav[key]) || {}
  const fallback = NAV_DEFAULTS[key]
  const icon = fromConfig.icon || fallback.icon || site.industryIcon || 'mdi-toolbox'
  return { title: fromConfig.label || fallback.label, icon }
}

/**
 * Menu entries in page order: Home (the hero, id "top") and then each
 * section that is switched on. Used by the header, the mobile drawer and the
 * section highlighting, so all three always agree.
 * @param {object} site
 * @returns {Array<{id: string, title: string, icon: string}>}
 */
export function navItems (site) {
  const items = [
    { key: 'home', id: 'top', show: true },
    { key: 'services', id: 'services', show: moduleOn(site, 'services') },
    { key: 'projects', id: 'projects', show: galleryOn(site) },
    { key: 'about', id: 'about', show: moduleOn(site, 'about') },
    { key: 'reviews', id: 'reviews', show: moduleOn(site, 'reviews') && (site.reviews || []).length > 0 },
    { key: 'quote', id: 'quote', show: moduleOn(site, 'quoteForm') },
    { key: 'contact', id: 'contact', show: moduleOn(site, 'contact') }
  ]
  return items.filter(item => item.show).map(({ key, id }) => ({ id, ...navEntry(site, key) }))
}

/**
 * A link value that has been entered at all. Unlike isUsableUrl this keeps
 * values that still carry a to-do marker: the template and preview builds
 * show the Facebook and social sections with their placeholder links so the
 * layout can be reviewed, and check-site.ps1 reports the marker (a warning
 * in preview, a failure at launch). Empty means "this business has none",
 * which hides the section.
 * @param {*} value
 * @returns {string} the trimmed value, or ''
 */
export function enteredLink (value) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * The Facebook page for the "Connect With Us" button, or '' to hide it
 * @param {object} site
 * @returns {string}
 */
export function facebookPageUrl (site) {
  return enteredLink(site.facebookUrl)
}

/**
 * Social profiles for the footer's "Follow Us" buttons. A list, so
 * Instagram, YouTube and others can be added in site-config.js without
 * touching the footer. Entries without a name or URL are skipped; an empty
 * list hides "Follow Us".
 * @param {object} site
 * @returns {Array<{ name: string, url: string, icon: string }>}
 */
export function socialLinks (site) {
  return (Array.isArray(site.social) ? site.social : [])
    .filter(entry => entry && enteredLink(entry.name) && enteredLink(entry.url))
    .map(entry => ({
      name: entry.name.trim(),
      url: entry.url.trim(),
      // A generic link icon if the entry names none
      icon: enteredLink(entry.icon) || 'mdi-link-variant'
    }))
}

// Zoom levels for the contact map: a street for an address, a whole town
// for a service-area business, and the whole country as a neutral fallback
const MAP_ZOOM = { address: 15, city: 11, neutral: 4 }
// Geographic centre of the contiguous United States, for the neutral view
const US_CENTRE = '39.8283,-98.5795'

/**
 * Everything the contact card's map needs, decided from the config:
 *
 * - 'address': showStreetAddress is true and the street is filled in. The
 *   map pins the full address.
 * - 'city': the street is hidden (most service-area businesses). The map is
 *   centred on baseCity at town zoom, so no pin lands on anyone's house.
 * - 'neutral': baseCity still has a to-do marker (the template, early
 *   previews). A map search for the placeholder text shows an error or a
 *   random place, so the map shows the whole US instead.
 *
 * There's no separate "Open in Maps" link: Google's embedded map shows its
 * own, as on the reference site. "Get Directions" is always present (see
 * directionsLink below).
 *
 * @param {object} site
 * @returns {{ mode: string, place: string, embedUrl: string, directionsUrl: string }}
 */
export function contactMap (site) {
  const embed = (query, zoom) => `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`
  const directionsUrl = directionsLink(site)

  if (!isFilled(site.baseCity)) {
    return {
      mode: 'neutral',
      place: 'the United States',
      embedUrl: `https://maps.google.com/maps?ll=${US_CENTRE}&z=${MAP_ZOOM.neutral}&output=embed`,
      directionsUrl
    }
  }

  if (site.showStreetAddress === true && isFilled(site.streetAddress)) {
    const postal = isFilled(site.postalCode) ? ` ${site.postalCode}` : ''
    const address = `${site.streetAddress}, ${site.baseCity}${postal}`
    return {
      mode: 'address',
      place: address,
      embedUrl: embed(address, MAP_ZOOM.address),
      directionsUrl
    }
  }

  return {
    mode: 'city',
    place: site.baseCity,
    embedUrl: embed(site.baseCity, MAP_ZOOM.city),
    directionsUrl
  }
}

/**
 * Where the "Get Directions" button goes. The button always shows, as on
 * the reference site, so this always returns a link:
 *
 * - showStreetAddress true: Google Maps directions to the street address.
 * - showStreetAddress false: the business's Google Maps profile
 *   (googleReviewsUrl), which has its own Directions button. This way a
 *   home-based owner's street address is never written into the site.
 * - showStreetAddress false and no profile: directions to baseCity.
 *
 * Values are only checked for being entered, not for to-do markers, so the
 * template and previews still render the button (check-site.ps1 reports
 * the markers). The street address is only ever read in the first case.
 *
 * @param {object} site
 * @returns {string}
 */
export function directionsLink (site) {
  const directionsTo = destination => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
  const street = enteredLink(site.streetAddress)
  const city = enteredLink(site.baseCity)

  if (site.showStreetAddress === true && street) {
    const postal = enteredLink(site.postalCode)
    return directionsTo([street, city].filter(Boolean).join(', ') + (postal ? ` ${postal}` : ''))
  }

  const profile = enteredLink(site.googleReviewsUrl)
  if (profile) return profile

  return city ? directionsTo(city) : 'https://www.google.com/maps/dir/?api=1'
}

/**
 * An sms: link, optionally with a pre-filled message, or '' when texting is
 * switched off (smsHref null or empty).
 *
 * "?&body=" works on both iPhone and Android: iOS reads the part after "&",
 * Android ignores the empty first parameter.
 *
 * @param {object} site
 * @param {string} [body]
 * @returns {string}
 */
export function smsLink (site, body) {
  if (!site.smsHref) return ''
  return body ? `${site.smsHref}?&body=${encodeURIComponent(body)}` : site.smsHref
}

/**
 * How the quote form handles photos, after checking the setting can work:
 * 'sms' needs a text number and 'emailjs' needs the form switched on.
 * Anything else falls back to 'off' rather than showing a broken control.
 * @param {object} site
 * @returns {'off'|'sms'|'emailjs'}
 */
export function photoMode (site) {
  const mode = site.quoteForm && site.quoteForm.photoMode
  if (mode === 'sms' && site.smsHref) return 'sms'
  if (mode === 'emailjs') return 'emailjs'
  return 'off'
}

/**
 * Categories present in the projects, in first-seen order, for the gallery
 * filter buttons
 * @param {Array<{category: string}>} projects
 * @returns {string[]}
 */
export function galleryCategories (projects) {
  const seen = []
  ;(projects || []).forEach(project => {
    if (project.category && !seen.includes(project.category)) seen.push(project.category)
  })
  return seen
}

/**
 * Splits text into paragraphs at blank lines
 * @param {string} text
 * @returns {string[]}
 */
export function paragraphs (text) {
  return String(text || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
}

/**
 * Resolves a path from config (relative to public/) against the page's
 * base URL. process.env.BASE_URL is './' (vue.config.js publicPath), so the
 * result stays relative and works under any GitHub Pages sub-folder.
 * Absolute URLs are returned unchanged.
 * @param {string} path
 * @returns {string}
 */
export function asset (path) {
  if (!path) return ''
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path
  return (process.env.BASE_URL || './') + path.replace(/^\.?\//, '')
}
