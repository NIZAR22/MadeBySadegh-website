/**
 * site-config.js
 *
 * Single source of truth for one client's site. Every client project created
 * from this template edits ONLY this file (plus the images in public/images/)
 * for business details. That keeps template upgrades easy (components never
 * change per client) and stops one client's details leaking into another
 * client's site.
 *
 * Rules for this file:
 * - Every value still waiting for real client data carries a to-do marker
 *   (one of the two capitalised marker words listed in scripts/check-site.ps1),
 *   in the value itself or in a comment on the same line, so the check script
 *   can list anything that was missed. Remove the marker comment once the
 *   value is real.
 * - Review text is pasted verbatim from the review site. Never invent or
 *   paraphrase reviews.
 * - Licensing and insurance claims stay off until the client confirms them
 *   in writing (see the Licensing section below).
 *
 * CommonJS (module.exports) rather than an ES module so that vue.config.js
 * (Node, at build time) and the Vue components (webpack, in the browser) can
 * both read the same file.
 */
const SITE = {
  // ---- Launch status ----
  // false = PREVIEW: the site can go live so the client can see it and decide,
  // even with to-do markers and placeholder images left. The check script
  // reports those as warnings instead of failures, search engines are told not
  // to index the page (noindex meta tag, robots.txt "Disallow: /", no JSON-LD,
  // sitemap.xml or llms.txt), and if the EmailJS keys aren't real yet the form
  // asks visitors to call or text instead of sending.
  // true = LAUNCH: everything is strict. Every marker and placeholder image
  // fails the check, the quote-form keys must be real or the build stops, and
  // the page is indexable. Only an explicit true counts.
  launchReady: false,
  // Small "Preview" ribbon in the corner while launchReady is false. Off by
  // default so the preview looks finished when shown to the client; never
  // shown once launchReady is true.
  showPreviewBadge: false,

  // ---- Identity ----
  businessName: 'TODO Business Name',
  ownerName: 'TODO Owner Name',
  tagline: 'TODO short tagline',
  // What the business does, in a few words. Used in llms.txt and the no-JavaScript fallback.
  industryNoun: 'TODO e.g. handyman services or pressure washing',
  // Material Design Icons name (https://pictogrammers.com/library/mdi/) used
  // for the project-type field of the quote form (and for the Services menu
  // entry if nav.services below has no icon), so no trade-specific icon is
  // hard-coded in a component.
  industryIcon: 'mdi-toolbox',
  yearsExperience: 'TODO e.g. 10+',

  // ---- Logo ----
  // SVG or PNG in public/images/. alt stays empty because the business name
  // is printed right next to the logo; repeating it would make screen readers
  // announce the name twice.
  logo: { src: 'images/logo.svg', alt: '' },

  // ---- Contact ----
  phoneDisplay: '(555) 555-5555', // PLACEHOLDER
  phoneHref: 'tel:+15555555555', // PLACEHOLDER
  smsHref: 'sms:+15555555555', // PLACEHOLDER (null hides every Text button)
  email: 'TODO@example.com',
  hours: 'TODO hours, e.g. Mon-Fri 8 AM - 5 PM',

  // ---- Location ----
  // "City, ST": the part after the last comma becomes the state in the
  // search-engine data. The contact map centres on this city (or on the
  // street address when showStreetAddress is true); while it still has a
  // to-do marker the map shows the whole US instead.
  baseCity: 'TODO City, ST',
  postalCode: 'TODO',
  // Service-area businesses usually hide the street address: the map then
  // shows the town, not a pin on the owner's house, and there's no "Get
  // Directions" button. true pins the address and adds directions.
  showStreetAddress: false,
  streetAddress: 'TODO street address', // Only rendered when showStreetAddress is true.
  serviceArea: ['TODO City 1', 'TODO City 2'],
  serviceAreaSummary: 'TODO e.g. Proudly serving the whole county',
  // One sentence under the business name in the footer, e.g. "Handyman
  // services and small repairs across the whole county".
  footerDescription: 'TODO one sentence describing the business',

  // ---- Licensing / trust ----
  // Licensing claims are legally sensitive (e.g. Florida statute 489.103
  // forbids unlicensed businesses advertising as contractors), so they're OFF
  // by default and only appear when explicitly confirmed.
  isLicensed: false,
  licenseNumber: '', // Shown in the footer only when isLicensed is true and this is set.
  isInsured: null, // null = unknown, so nothing is shown. true shows "Insured".
  // Enforced by scripts/check-site.ps1 when isLicensed is false: none of these
  // words may appear in visible copy, alt text or meta tags. Matching is
  // case-insensitive and whole-word, and each entry also catches its plural
  // and -ed/-ing forms ('license' catches licenses, licensed and licensing;
  // 'permit' catches permits and permitted). Trade names are listed with
  // their activity word (plumber and plumbing) because an unlicensed site
  // mustn't advertise those trades at all.
  restrictedWords: ['contractor', 'license', 'plumber', 'plumbing',
    'electrician', 'electrical', 'roofer', 'roofing', 'permit'],
  // Exact phrases exempt from the restricted-word check, e.g. a sentence that
  // describes other people rather than the business ('family friends who
  // were contractors'). Matched case-insensitively before the word check, and
  // every one is printed in the check output so exemptions stay visible.
  // Keep this list short and specific: never add a bare restricted word.
  allowedPhrases: [],

  // ---- Search engines and link previews ----
  // Address the site is published at, with a trailing slash. Used for the
  // canonical link, Open Graph tags, sitemap.xml, robots.txt and llms.txt.
  siteUrl: 'https://nizar22.github.io/TODO-repo-name/',
  seo: {
    // About 50-60 characters: "<Service> in <City, ST> | <Business name>"
    title: 'TODO page title',
    // About 150 characters: services, area and the call to action
    description: 'TODO meta description',
    // 1200x630 image in public/images/ for Facebook, texts and other link previews
    ogImage: 'images/og-image.jpg'
  },
  // Schema.org type for the search-engine data. Must match what the business
  // can legally claim, e.g. HomeAndConstructionBusiness rather than
  // GeneralContractor for an unlicensed handyman.
  schemaType: 'LocalBusiness',

  // ---- Links ----
  // Empty strings (or values still containing a to-do marker) hide the
  // matching buttons, so nothing links to a wrong profile.
  // The business's Facebook page: the "Connect With Us" button in the
  // Contact section. Empty hides it. The feed module (modules.facebookFeed)
  // only loads once this is a finished link with no to-do marker.
  facebookUrl: 'https://www.facebook.com/TODO-page',
  // Round "Follow Us" buttons in the footer, in this order. Add Instagram and
  // others as more entries, e.g.
  //   { name: 'Instagram', url: 'https://www.instagram.com/...', icon: 'mdi-instagram' }
  // icon is a Material Design Icons name. An empty list hides "Follow Us".
  social: [
    { name: 'Facebook', url: 'https://www.facebook.com/TODO-page', icon: 'mdi-facebook' }
  ],
  googleReviewsUrl: '',
  googleWriteReviewUrl: '',
  thumbtackUrl: '',
  // One summary per review site, e.g. { source: 'Google', value: '4.8', count: 25, url: 'https://...' }
  ratings: [
    { source: 'TODO Review Site', value: '5.0', count: 0, url: '' }
  ],

  // ---- Theme ----
  // Fed into the Vuetify theme and the CSS custom properties at build time.
  // scripts/check-site.ps1 checks these pairs against WCAG AA (4.5:1):
  // text and muted on background and surface, onPrimary on primary,
  // onAccent on accent, and accentText on background and surface.
  theme: {
    primary: '#1F2328', // Header, footer, primary buttons
    onPrimary: '#FFFFFF', // Text on primary
    accent: '#C8873A', // Accent buttons and highlights (use with onAccent text only)
    onAccent: '#1F2328', // Text on accent buttons
    accentText: '#8F5A22', // Accent-coloured text on light backgrounds
    background: '#F7F4EF', // Page background
    surface: '#FFFFFF', // Cards and alternating sections
    text: '#1F2328', // Body text
    muted: '#5B616B', // Secondary text
    headingFont: 'Oswald', // Any Google Fonts family name
    bodyFont: 'Inter'
  },

  // ---- Menu ----
  // Label and Material Design Icons name for each menu entry, used in the
  // header, the phone menu drawer and nowhere else. Entries only appear
  // when their section is switched on below (Home always shows). Pick
  // icons that suit the trade, e.g. mdi-mower for lawn care.
  nav: {
    home: { label: 'Home', icon: 'mdi-home' },
    services: { label: 'Services', icon: 'mdi-toolbox' },
    projects: { label: 'Our Work', icon: 'mdi-image-multiple' },
    about: { label: 'About', icon: 'mdi-account' },
    reviews: { label: 'Reviews', icon: 'mdi-star' },
    quote: { label: 'Free Quote', icon: 'mdi-clipboard-text-outline' },
    contact: { label: 'Contact', icon: 'mdi-phone' }
  },

  // ---- Modules: turn sections on/off per client ----
  modules: {
    services: true,
    gallery: false, // Before/after slider gallery.
    about: false, // "Meet the owner" section.
    reviews: true,
    facebookFeed: false, // Lazy-loaded Facebook Page Plugin (needs facebookUrl).
    quoteForm: true,
    serviceArea: true,
    contact: true
  },

  // ---- Content ----
  hero: {
    h1: 'TODO headline',
    sub: 'TODO subheadline',
    // 1920x1080 photo. The image is darkened behind the text, so any photo works.
    image: 'images/placeholder-hero.jpg',
    // Short trust points shown under the headline. Licensing (when allowed by
    // the flags above) and the ratings are added automatically after these.
    trustItems: ['TODO e.g. Serving the whole county', 'Free Quotes']
  },
  // Services grouped under headings. icon is a Material Design Icons name.
  serviceGroups: [
    {
      title: 'TODO Service Group',
      items: [
        { name: 'TODO Service', description: 'TODO one-line description', icon: 'mdi-hammer-wrench' },
        { name: 'TODO Service', description: 'TODO one-line description', icon: 'mdi-wrench' }
      ]
    },
    {
      title: 'TODO Service Group',
      items: [
        { name: 'TODO Service', description: 'TODO one-line description', icon: 'mdi-format-paint' },
        { name: 'TODO Service', description: 'TODO one-line description', icon: 'mdi-ruler-square' }
      ]
    }
  ],
  servicesFootnote: 'TODO optional footnote under the services (empty string hides it)',
  // "Why choose us" points. A licensing point is added automatically only
  // when the licensing flags allow it.
  whyChooseUs: [
    { icon: 'mdi-clock-check-outline', title: 'TODO Reason', description: 'TODO one sentence' },
    { icon: 'mdi-broom', title: 'TODO Reason', description: 'TODO one sentence' },
    { icon: 'mdi-message-text-outline', title: 'TODO Reason', description: 'TODO one sentence' }
  ],
  // Before/after photos: 1200x900 (4:3) JPEGs in public/images/projects/.
  // category drives the filter buttons; alt describes the job, and the slider
  // adds "Before:" / "After:" in front of it.
  galleryImageSize: { width: 1200, height: 900 },
  projects: [
    { title: 'TODO Project', category: 'TODO Category A', beforeSrc: 'images/placeholder-before.jpg', afterSrc: 'images/placeholder-after.jpg', alt: 'TODO describe the job' },
    { title: 'TODO Project', category: 'TODO Category B', beforeSrc: 'images/placeholder-before.jpg', afterSrc: 'images/placeholder-after.jpg', alt: 'TODO describe the job' }
  ],
  // Owner photo: 800x1000 (4:5) JPEG. Blank lines in text start new paragraphs.
  about: {
    photo: 'images/placeholder-owner.jpg',
    text: 'TODO a few sentences in the owner\'s own voice',
    badges: ['TODO Value', 'TODO Value']
  },
  // Verbatim reviews only. source must match a ratings[].source to share its badge.
  reviews: [
    { quote: 'TODO paste verbatim review text', name: 'TODO First L.', source: 'TODO Review Site', stars: 5 }
  ],
  quoteForm: {
    // EmailJS and reCAPTCHA keys for this client. They end up in the public
    // JavaScript anyway (that's how EmailJS works), so they live here rather
    // than in secrets. SETUP.md explains how to create them; a production
    // build stops if any still contains a to-do marker.
    emailjsPublicKey: 'TODO EmailJS public key',
    emailjsServiceId: 'TODO EmailJS service ID',
    emailjsTemplateId: 'TODO EmailJS template ID',
    recaptchaSiteKey: 'TODO reCAPTCHA v2 site key',
    projectTypes: ['TODO type 1', 'TODO type 2', 'Other'],
    projectSizes: [], // Empty hides the field.
    timelines: ['ASAP', 'Within a month', '1-3 months', 'Just planning'], // Empty hides the field.
    successMessage: 'Thanks! We\'ll get back to you within 1 business day.',
    // Photo attachments:
    //   'off'     no photo option
    //   'sms'     a "Text photos of your project" button (needs smsHref)
    //   'emailjs' photos resized in the browser and sent as attachments
    //             (needs EmailJS Professional or higher; see SETUP.md)
    photoMode: 'off',
    smsPhotoBody: 'Hi, I just sent a quote request from your website — here are photos of my project:',
    maxPhotos: 5,
    photoMaxEdge: 1280, // Longest side in pixels after resizing
    photoQuality: 0.7, // JPEG quality 0-1
    // EmailJS Professional rejects requests over 2 MB; staying a little under
    // leaves room for the text fields and EmailJS's own envelope.
    maxRequestBytes: 1900000
  },
  analyticsId: '' // Google Analytics 4 ID (G-XXXXXXX). Empty = no analytics loaded.
}

module.exports = SITE
