/**
 * A complete, finished config for tests, independent of site-config.js.
 *
 * Tests must pass in the template AND in every client repo made from it,
 * whatever that client's site-config.js says, so they never read the real
 * config. makeSite() returns a fresh copy with any overrides merged in.
 *
 * The fixture is a launched site (launchReady: true); preview-mode tests
 * pass { launchReady: false } as an override.
 */
const base = () => ({
  launchReady: true,
  showPreviewBadge: false,
  businessName: 'Example Home Services',
  ownerName: 'Alex Example',
  tagline: 'Your local fixer',
  industryNoun: 'home repairs',
  industryIcon: 'mdi-toolbox',
  yearsExperience: '12+',
  logo: { src: 'images/logo.svg', alt: '' },
  phoneDisplay: '(555) 010-0100',
  phoneHref: 'tel:+15550100100',
  smsHref: 'sms:+15550100100',
  email: 'hello@example.com',
  hours: 'Mon-Fri 8 AM - 5 PM',
  baseCity: 'Springfield, IL',
  postalCode: '62701',
  showStreetAddress: false,
  streetAddress: '1 Example St',
  serviceArea: ['Springfield', 'Riverton'],
  serviceAreaSummary: 'Serving Sangamon County',
  footerDescription: 'Repairs and small projects around Springfield.',
  isLicensed: false,
  licenseNumber: '',
  isInsured: null,
  restrictedWords: ['contractor', 'license', 'plumber', 'plumbing', 'permit'],
  allowedPhrases: [],
  siteUrl: 'https://example.github.io/Example-website/',
  seo: { title: 'Repairs in Springfield, IL | Example', description: 'Repairs & more <fast>', ogImage: 'images/og-image.jpg' },
  schemaType: 'HomeAndConstructionBusiness',
  facebookUrl: 'https://www.facebook.com/example',
  social: [
    { name: 'Facebook', url: 'https://www.facebook.com/example', icon: 'mdi-facebook' },
    { name: 'Instagram', url: 'https://www.instagram.com/example', icon: 'mdi-instagram' }
  ],
  nav: {
    home: { label: 'Home', icon: 'mdi-home' },
    services: { label: 'Services', icon: 'mdi-hammer-wrench' },
    projects: { label: 'Our Work', icon: 'mdi-image-multiple' },
    about: { label: 'About', icon: 'mdi-account' },
    reviews: { label: 'Reviews', icon: 'mdi-star' },
    quote: { label: 'Free Quote', icon: 'mdi-clipboard-text-outline' },
    contact: { label: 'Contact', icon: 'mdi-phone' }
  },
  googleReviewsUrl: 'https://g.page/example',
  googleWriteReviewUrl: 'https://g.page/example/review',
  thumbtackUrl: 'https://www.thumbtack.com/example',
  ratings: [
    { source: 'Google', value: '4.6', count: 10, url: 'https://g.page/example' },
    { source: 'Thumbtack', value: '5.0', count: 6, url: '' }
  ],
  theme: {
    primary: '#1F2328',
    onPrimary: '#FFFFFF',
    accent: '#C8873A',
    onAccent: '#1F2328',
    accentText: '#8F5A22',
    background: '#F7F4EF',
    surface: '#FFFFFF',
    text: '#1F2328',
    muted: '#5B616B',
    headingFont: 'Oswald',
    bodyFont: 'Inter'
  },
  modules: {
    services: true,
    gallery: true,
    about: true,
    reviews: true,
    facebookFeed: true,
    quoteForm: true,
    serviceArea: true,
    contact: true
  },
  hero: { h1: 'Repairs in Springfield', sub: 'Done right.', image: 'images/hero.jpg', trustItems: ['Serving the county', 'Free Quotes'] },
  serviceGroups: [
    { title: 'Repairs', items: [{ name: 'Drywall', description: 'Patches and texture', icon: 'mdi-wall' }] },
    { title: 'Improvements', items: [{ name: 'Flooring', description: 'LVP and laminate', icon: 'mdi-floor-plan' }] }
  ],
  servicesFootnote: 'Text a photo for a fast answer.',
  whyChooseUs: [{ icon: 'mdi-clock', title: 'On time', description: 'We show up.' }],
  galleryImageSize: { width: 1200, height: 900 },
  projects: [
    { title: 'Kitchen floor', category: 'Flooring', beforeSrc: 'images/p1-before.jpg', afterSrc: 'images/p1-after.jpg', alt: 'kitchen floor' },
    { title: 'Stairs', category: 'Carpentry', beforeSrc: 'images/p2-before.jpg', afterSrc: 'images/p2-after.jpg', alt: 'stairs' },
    { title: 'Trim', category: 'Carpentry', beforeSrc: 'images/p3-before.jpg', afterSrc: 'images/p3-after.jpg', alt: 'trim' }
  ],
  about: { photo: 'images/owner.jpg', text: 'First paragraph.\n\nSecond paragraph.', badges: ['Punctual', 'Clean'] },
  reviews: [
    { quote: 'Great work.', name: 'Pat Q.', source: 'Google', stars: 5 },
    { quote: 'Fast and tidy.', name: 'Sam R.', source: 'Thumbtack', stars: 5 }
  ],
  quoteForm: {
    emailjsPublicKey: 'pk_test',
    emailjsServiceId: 'service_test',
    emailjsTemplateId: 'template_test',
    recaptchaSiteKey: 'site_key_test',
    projectTypes: ['Repair', 'Flooring', 'Other'],
    projectSizes: ['Small', 'Large'],
    timelines: ['ASAP', 'Later'],
    successMessage: 'Thanks! We will reply soon.',
    photoMode: 'off',
    smsPhotoBody: 'Here are photos:',
    maxPhotos: 3,
    photoMaxEdge: 1280,
    photoQuality: 0.7,
    maxRequestBytes: 1900000
  },
  analyticsId: ''
})

const isObject = value => value && typeof value === 'object' && !Array.isArray(value)

/**
 * Deep-merges plain objects; arrays and other values replace
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
function merge (target, source) {
  Object.keys(source || {}).forEach(key => {
    if (isObject(source[key]) && isObject(target[key])) {
      merge(target[key], source[key])
    } else {
      target[key] = source[key]
    }
  })
  return target
}

/**
 * @param {object} [overrides] - deep-merged into the base fixture
 * @returns {object} a fresh config
 */
export function makeSite (overrides) {
  return merge(base(), overrides)
}
