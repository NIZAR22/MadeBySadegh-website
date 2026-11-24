/**
 * site-config.js
 *
 * Single source of truth for one client's site. Every client project created
 * from this template edits ONLY this file (plus the images in public/images/)
 * for business details. That keeps template upgrades easy (components never
 * change per client) and stops one client's details leaking into another
 * client's site.
 *
 * This copy is Made By Sadegh's own site (madebysadegh.work): websites,
 * automation and AI for small businesses, with hands-on tech/home services
 * second. The gallery doubles as the portfolio of live client sites.
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
  businessName: 'Made By Sadegh',
  ownerName: 'Sadegh Hajiazimi',
  tagline: 'Made to work.',
  // What the business does, in a few words. Used in llms.txt and the no-JavaScript fallback.
  industryNoun: 'websites, automation and AI for small businesses',
  // Material Design Icons name (https://pictogrammers.com/library/mdi/) used
  // for the project-type field of the quote form (and for the Services menu
  // entry if nav.services below has no icon), so no trade-specific icon is
  // hard-coded in a component.
  industryIcon: 'mdi-laptop',
  // Empty on purpose: the About section prints "<value> years of experience"
  // under its heading, and no figure has been confirmed for this site.
  yearsExperience: '',

  // ---- Logo ----
  // SVG or PNG in public/images/. alt stays empty because the business name
  // is printed right next to the logo; repeating it would make screen readers
  // announce the name twice.
  // The header slot is a 40x40 square beside the business name, on navy.
  // logo.svg is "3 Icon/MadeBySadegh-icon-circle.svg": its orange ring reads
  // on the navy header.
  logo: { src: 'images/logo.svg', alt: '' },
  // Footer badge (optional key, see TEMPLATE-CHANGES.md): the dark-background
  // badge, since the footer is navy. alt empty: the name is printed below it.
  footerLogo: { src: 'images/footer-badge.svg', alt: '' },

  // ---- Contact ----
  phoneDisplay: '(407) 873-8425',
  phoneHref: 'tel:+14078738425',
  smsHref: 'sms:+14078738425',
  email: 'madebysadegh@gmail.com',
  hours: 'Mon–Sat, by appointment. Call, text or email.',

  // ---- Location ----
  // "City, ST": the part after the last comma becomes the state in the
  // search-engine data. The contact map centres on this city (or on the
  // street address when showStreetAddress is true); while it still has a
  // to-do marker the map shows the whole US instead.
  baseCity: 'Palm Bay, FL',
  postalCode: '32907',
  // The business runs from the owner's home, so the street is never shown:
  // the map centres on Palm Bay with no pin, "Get Directions" goes to the
  // city, and the JSON-LD leaves the street out.
  showStreetAddress: false,
  // Deliberately empty (not just hidden): the home street must never be
  // stored in a public repo. scripts/blocklist.txt also blocks its name.
  streetAddress: '',
  serviceArea: ['Palm Bay', 'Melbourne', 'West Melbourne', 'Malabar', 'Viera', 'Rockledge',
    'Cocoa', 'Satellite Beach', 'Indialantic', 'Melbourne Beach', 'Titusville'],
  serviceAreaSummary: 'Websites and automation for clients anywhere in the U.S. Hands-on services across Brevard County.',
  // One sentence under the business name in the footer, e.g. "Handyman
  // services and small repairs across the whole county".
  footerDescription: 'Websites, automation and AI for small businesses, plus hands-on tech help around Brevard County.',

  // ---- Licensing / trust ----
  // Licensing claims are legally sensitive (e.g. Florida statute 489.103
  // forbids unlicensed businesses advertising as contractors), so they're OFF
  // by default and only appear when explicitly confirmed.
  isLicensed: false,
  licenseNumber: '', // Shown in the footer only when isLicensed is true and this is set.
  isInsured: false, // TODO: set true once general liability insurance is in place.
  // Enforced by scripts/check-site.ps1 when isLicensed is false: none of these
  // words may appear in visible copy, alt text or meta tags. Matching is
  // case-insensitive and whole-word, and each entry also catches its plural
  // and -ed/-ing forms ('license' catches licenses, licensed and licensing;
  // 'permit' catches permits and permitted). Trade names are listed with
  // their activity word (plumber and plumbing) because an unlicensed site
  // mustn't advertise those trades at all.
  // Added for this site: 'wire' (catches wiring/wired) and both spellings of
  // low voltage, because TV mounting, Wi-Fi and smart-home copy could drift
  // into describing regulated electrical work.
  restrictedWords: ['contractor', 'license', 'plumber', 'plumbing',
    'electrician', 'electrical', 'roofer', 'roofing', 'permit',
    'wire', 'low-voltage', 'low voltage'],
  // Exact phrases exempt from the restricted-word check, e.g. a sentence that
  // describes other people rather than the business ('family friends who
  // were contractors'). Matched case-insensitively before the word check, and
  // every one is printed in the check output so exemptions stay visible.
  // Keep this list short and specific: never add a bare restricted word.
  allowedPhrases: [],

  // ---- Search engines and link previews ----
  // Address the site is published at, with a trailing slash. Used for the
  // canonical link, Open Graph tags, sitemap.xml, robots.txt and llms.txt.
  // Set to the custom domain from the start: the site is noindex until
  // launch, and the canonical/OG URLs should never point at github.io.
  siteUrl: 'https://madebysadegh.work/',
  seo: {
    // About 50-60 characters: "<Service> in <City, ST> | <Business name>"
    title: 'Websites, Automation & AI | Made By Sadegh, Palm Bay FL',
    // About 150 characters: services, area and the call to action
    description: 'Websites that bring in leads, automation that saves hours, and AI receptionists for small businesses. Based in Palm Bay, serving Brevard County and beyond.',
    // 1200x630 image in public/images/ for Facebook, texts and other link previews
    // Navy card: dark-background horizontal logo + "Websites · Automation · AI"
    ogImage: 'images/og-image.jpg'
  },
  // Schema.org type for the search-engine data. Must match what the business
  // can legally claim, e.g. HomeAndConstructionBusiness rather than
  // GeneralContractor for an unlicensed handyman.
  schemaType: 'ProfessionalService',

  // ---- Links ----
  // Empty strings (or values still containing a to-do marker) hide the
  // matching buttons, so nothing links to a wrong profile.
  // The business's Facebook page: the "Connect With Us" button in the
  // Contact section. Empty hides it. The feed module (modules.facebookFeed)
  // only loads once this is a finished link with no to-do marker.
  facebookUrl: '', // TODO: Facebook page URL once it exists
  // Round "Follow Us" buttons in the footer, in this order. Add Instagram and
  // others as more entries, e.g.
  //   { name: 'Instagram', url: 'https://www.instagram.com/...', icon: 'mdi-instagram' }
  // icon is a Material Design Icons name. An empty list hides "Follow Us".
  social: [], // TODO: add LinkedIn (mdi-linkedin) and Facebook (mdi-facebook)
  googleReviewsUrl: '',
  googleWriteReviewUrl: '',
  thumbtackUrl: '',
  // One summary per review site, e.g. { source: 'Google', value: '4.8', count: 25, url: 'https://...' }
  // Empty: the hero trust line adds nothing, and the JSON-LD never carries
  // ratings anyway (see build/site-build.js).
  ratings: [], // TODO: add real ratings once there are reviews

  // ---- Theme ----
  // Fed into the Vuetify theme and the CSS custom properties at build time.
  // scripts/check-site.ps1 checks these pairs against WCAG AA (4.5:1):
  // text and muted on background and surface, onPrimary on primary,
  // onAccent on accent, and accentText on background and surface.
  // Colours from the Made By Sadegh logo. Measured ratios: onPrimary/primary
  // 14.63, onAccent/accent 4.81, accentText 4.82 (background) / 5.18
  // (surface), text 13.63+, muted 8.46+.
  theme: {
    primary: '#0F2A44', // Navy: header, footer, primary buttons
    onPrimary: '#FFFFFF', // Text on primary
    accent: '#F26B1D', // Orange: buttons and accents only (use with onAccent text only)
    // Navy, not white: navy on this orange is 4.81:1 (passes AA), white is 3.05:1 (fails)
    onAccent: '#0F2A44',
    // Darker orange for links and small text; #F26B1D itself is too light on white
    accentText: '#C2410C',
    background: '#F7F7F4', // Page background
    surface: '#FFFFFF', // Cards and alternating sections
    text: '#0F2A44', // Body text
    muted: '#3B4A5A', // Secondary text
    headingFont: 'Space Grotesk', // Any Google Fonts family name
    bodyFont: 'Inter'
  },

  // ---- Menu ----
  // Label and Material Design Icons name for each menu entry, used in the
  // header, the phone menu drawer and nowhere else. Entries only appear
  // when their section is switched on below (Home always shows). Pick
  // icons that suit the trade, e.g. mdi-mower for lawn care.
  nav: {
    home: { label: 'Home', icon: 'mdi-home' },
    services: { label: 'Services', icon: 'mdi-laptop' },
    // The gallery section is used as the portfolio
    projects: { label: 'Portfolio', icon: 'mdi-briefcase-outline' },
    about: { label: 'About', icon: 'mdi-account' },
    reviews: { label: 'Reviews', icon: 'mdi-star' },
    // The quote form is used as "Start a project"
    quote: { label: 'Start a Project', icon: 'mdi-rocket-launch-outline' },
    contact: { label: 'Contact', icon: 'mdi-phone' }
  },

  // ---- Modules: turn sections on/off per client ----
  modules: {
    services: true,
    // Used as the portfolio: projects with url + image render as linked
    // screenshot cards (see TEMPLATE-CHANGES.md).
    gallery: true,
    about: true, // "Meet the owner" section.
    // Off until there are real testimonials (ask Tru Lawns and Southern and Sons).
    reviews: false,
    // Off until a Facebook page exists.
    facebookFeed: false,
    quoteForm: true, // Used as "Start a project".
    serviceArea: true,
    contact: true
  },

  // ---- Content ----
  hero: {
    h1: 'Websites that work as hard as you do.',
    sub: 'I build websites for small businesses that bring in leads, automate the busywork, and answer customers with AI, all from one local developer in Palm Bay, FL.',
    // No photo on this site: an empty value skips the <img> and the dark
    // overlay, leaving the section's true primary navy behind the headline.
    image: '',
    // Faint orbit motif from the logo, behind the text (optional key)
    pattern: 'images/hero-orbit.svg',
    // Optional button overrides (see TEMPLATE-CHANGES.md). secondaryCta
    // replaces the hero's Call/Text buttons; the floating call button,
    // drawer and contact cards still offer both.
    primaryCta: { label: 'Start a project', href: '#quote', icon: 'mdi-rocket-launch-outline' },
    secondaryCta: { label: 'See my work', href: '#projects', icon: 'mdi-briefcase-outline' },
    // Short trust points shown under the headline. Licensing (when allowed by
    // the flags above) and the ratings are added automatically after these.
    trustItems: ['Local to Palm Bay', 'One person start to finish', 'Month-to-month care plans']
  },
  // Services grouped under headings. icon is a Material Design Icons name.
  // Tech first: it's the main business; hands-on services come second.
  serviceGroups: [
    {
      title: 'Business Tech',
      items: [
        { name: 'Websites That Work', description: 'Fast, mobile-friendly sites with a lead form that lands in your inbox or CRM.', icon: 'mdi-monitor-cellphone' },
        { name: 'Business Automation', description: 'Forms, follow-ups, invoicing and scheduling that run on their own.', icon: 'mdi-cog-sync-outline' },
        { name: 'AI Receptionist & Assistants', description: 'AI that answers calls and questions 24/7 and texts you when it matters.', icon: 'mdi-robot-outline' },
        // The template has no pricing section, so the one confirmed price
        // lives in this description. Starter Website and Automation prices
        // aren't set, so they appear nowhere ("custom quote" by default).
        // TODO: decide Starter Website and Automation "from" prices
        { name: 'Website Care Plans', description: 'Hosting, updates, backups and small changes handled every month. $150/month includes 2 hours of updates and changes; extra time is $75/hour. Month to month.', icon: 'mdi-calendar-sync-outline' }
      ]
    },
    {
      title: 'Hands-On Tech & Home Services (Brevard County)',
      items: [
        { name: 'TV Mounting & Setup', description: 'Level, secure mounting with cables managed.', icon: 'mdi-television' },
        { name: 'Home Wi-Fi & Network Setup', description: 'Routers, mesh Wi-Fi and dead-zone fixes.', icon: 'mdi-wifi' },
        { name: 'Smart Home Setup', description: 'Smart thermostats, plugs, speakers and doorbells connected and working.', icon: 'mdi-home-automation' },
        { name: 'Handyman Repairs & Assembly', description: 'Small repairs, fixtures and furniture assembly.', icon: 'mdi-hammer-wrench' }
      ]
    }
  ],
  servicesFootnote: 'Not sure where your project fits? Text me a photo or a quick description and I\'ll tell you straight.',
  // "Why choose us" points. A licensing point is added automatically only
  // when the licensing flags allow it.
  whyChooseUs: [
    { icon: 'mdi-account-check-outline', title: 'One Person, Start to Finish', description: 'The person you talk to is the person who builds it.' },
    { icon: 'mdi-cog-sync-outline', title: 'Built to Work', description: 'Every site I build connects to something that saves you time or brings in leads.' },
    { icon: 'mdi-map-marker-radius-outline', title: 'Local and Reachable', description: 'I\'m in Palm Bay. Call or text me, no ticket system.' }
  ],
  // Section wording for the gallery (optional keys, see TEMPLATE-CHANGES.md)
  gallery: {
    title: 'Portfolio',
    lead: 'Live sites I\'ve built. Each one opens in a new tab.'
  },
  // Before/after photos: 1200x900 (4:3) JPEGs in public/images/projects/.
  // category drives the filter buttons; alt describes the job, and the slider
  // adds "Before:" / "After:" in front of it.
  // Portfolio screenshots are 1600x900 desktop captures of each homepage.
  galleryImageSize: { width: 1600, height: 900 },
  // Portfolio: one entry per live site. url + image make each one a linked
  // screenshot card. Descriptions say only what was built: no results,
  // numbers or invented outcomes.
  projects: [
    {
      // A concept site, not a client project: worded so it never implies
      // the business hired Made By Sadegh.
      title: 'Concept site for a Palm Bay lawn-care business',
      category: 'Website',
      description: 'Website, quote form and an AI receptionist plan.',
      // The GitHub Pages build, not trulawnsfl.com: that domain serves a
      // separate WordPress site, not this one.
      url: 'https://nizar22.github.io/TruLawns-website/',
      image: 'images/portfolio/01-tru-lawns.jpg',
      alt: 'Homepage of a concept site for a Palm Bay lawn-care business'
    },
    {
      title: 'Southern and Sons Small Engine Repair',
      category: 'Website',
      description: 'Small engine repair shop website, kept up to date on a monthly care plan.',
      url: 'https://southernandsons.com',
      image: 'images/portfolio/02-southern-and-sons.jpg',
      alt: 'Southern and Sons Small Engine Repair homepage'
    }
    // TODO: add Luke's Handyman & Remodeling once nizar22.github.io/LukesRemodeling-website/ is live and not a noindex preview (it returned 404 on 2026-11-24)
  ],
  // Owner photo: 800x1000 (4:5) JPEG. Blank lines in text start new paragraphs.
  about: {
    // Badge logo on white, 800x1000, standing in for a photo.
    photo: 'images/about-badge.jpg', // TODO: replace with headshot (800x1000 JPEG)
    // Draft from the owner; he'll edit it.
    text: 'I\'m Sadegh. I\'ve spent years building software for manufacturing, the systems that track machines, parts and production data, so I know what it takes to make technology run reliably day after day.\n\n' +
      'Now I bring that to small businesses on the Space Coast: websites that bring in customers, automations that cut out busywork, and AI tools that answer when you can\'t.\n\n' +
      'I also still like working with my hands, so if you need a TV mounted or your Wi-Fi fixed, I do that too.',
    badges: ['Software Developer', 'Palm Bay Local', 'Made to work.']
  },
  // Verbatim reviews only. source must match a ratings[].source to share its badge.
  // Empty until real testimonials arrive (modules.reviews is off).
  reviews: [],
  quoteForm: {
    // EmailJS and reCAPTCHA keys for this client. They end up in the public
    // JavaScript anyway (that's how EmailJS works), so they live here rather
    // than in secrets. SETUP.md explains how to create them; a production
    // build stops if any still contains a to-do marker.
    // reCAPTCHA: the shared nizar22.github.io key won't cover madebysadegh.work;
    // add the domain to it or make a new v2 key (SETUP.md 1.4).
    emailjsPublicKey: 'TODO EmailJS public key',
    emailjsServiceId: 'TODO EmailJS service ID',
    emailjsTemplateId: 'TODO EmailJS template ID',
    recaptchaSiteKey: 'TODO reCAPTCHA v2 site key',
    projectTypes: [
      'New Website',
      'Website Redesign',
      'Automation (forms, email, invoicing, scheduling)',
      'AI Assistant or AI Receptionist',
      'Website Care Plan',
      'Home & Tech Services',
      'Other'
    ],
    // Wording overrides (optional keys, see TEMPLATE-CHANGES.md)
    title: 'Start a Project',
    submitLabel: 'Send My Project Details',
    // The size field is used as the budget; the form adds " (optional)".
    // EmailJS still receives it as {{project_size}}: label it "Budget" in
    // the EmailJS template.
    sizeLabel: 'Budget',
    comingSoonText: 'Online requests are coming soon — call, text or email me at madebysadegh@gmail.com.',
    projectSizes: ['Under $1,000', '$1,000–$3,000', '$3,000+', 'Not sure yet'], // Empty hides the field.
    timelines: ['ASAP', 'Within a month', '1-3 months', 'Just planning'], // Empty hides the field.
    successMessage: 'Thanks! I\'ll get back to you within 1 business day. Need it sooner? Call or text (407) 873-8425.',
    // Photo attachments:
    //   'off'     no photo option
    //   'sms'     a "Text photos of your project" button (needs smsHref)
    //   'emailjs' photos resized in the browser and sent as attachments
    //             (needs EmailJS Professional or higher; see SETUP.md)
    // 'sms': free, and handy for home-service jobs where a photo says it all.
    photoMode: 'sms',
    smsPhotoBody: 'Hi Sadegh, I just sent a project request from your website. Here are some photos:',
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
