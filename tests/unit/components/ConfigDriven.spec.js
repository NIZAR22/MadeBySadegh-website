/**
 * Config-driven rendering: modules switch sections on and off, licensing
 * flags gate every "Licensed & Insured" claim, and links only appear when
 * their URLs are set.
 */
import { mount, createLocalVue } from '@vue/test-utils'
import Vuetify from 'vuetify'
import App from '@/App.vue'
import HeroSection from '@/components/HeroSection.vue'
import ServicesSection from '@/components/ServicesSection.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import ReviewsSection from '@/components/ReviewsSection.vue'
import ContactSection from '@/components/ContactSection.vue'
import AboutSection from '@/components/AboutSection.vue'
import { makeSite } from '../fixtures/site'

const localVue = createLocalVue()

// The lazily loaded sections are stubbed: their own specs test them, and
// here only their presence matters
const lazyStubs = {
  GallerySection: { name: 'GallerySection', render: h => h('section', { attrs: { id: 'projects' } }) },
  FacebookFeed: { name: 'FacebookFeed', render: h => h('section', { attrs: { id: 'facebook' } }) },
  QuoteForm: { name: 'QuoteForm', render: h => h('section', { attrs: { id: 'quote' } }) }
}

const mountApp = site => mount(App, {
  localVue,
  vuetify: new Vuetify(),
  propsData: { site },
  stubs: lazyStubs
})

const sectionIds = wrapper => wrapper.findAll('main section[id]').wrappers.map(s => s.attributes('id'))

describe('App.vue modules', () => {
  it('renders every section with all modules on', () => {
    expect(sectionIds(mountApp(makeSite()))).toEqual(
      ['top', 'services', 'service-area', 'projects', 'about', 'reviews', 'facebook', 'quote', 'contact']
    )
  })

  it('renders only the hero with every module off, and a menu with just Home', () => {
    const modules = { services: false, gallery: false, about: false, reviews: false, facebookFeed: false, quoteForm: false, serviceArea: false, contact: false }
    const wrapper = mountApp(makeSite({ modules }))
    // 'top' is the hero (Home and the logo link scroll back to it)
    expect(sectionIds(wrapper)).toEqual(['top'])
    expect(wrapper.find('.hero').exists()).toBe(true)
    expect(wrapper.findAll('nav.nav a').wrappers.map(a => a.attributes('href'))).toEqual(['#top'])
  })

  it('skips the Facebook feed when the URL is empty, even with the module on', () => {
    expect(sectionIds(mountApp(makeSite({ facebookUrl: '' })))).not.toContain('facebook')
  })

  it('builds the menu from Home plus the switched-on sections', () => {
    const wrapper = mountApp(makeSite({ modules: { gallery: false, about: false } }))
    expect(wrapper.findAll('nav.nav a').wrappers.map(a => a.attributes('href'))).toEqual(
      ['#top', '#services', '#reviews', '#quote', '#contact']
    )
  })

  it('adds Our Work and About when those modules are on', () => {
    const wrapper = mountApp(makeSite())
    expect(wrapper.findAll('nav.nav a').wrappers.map(a => a.text())).toEqual(
      ['Home', 'Services', 'Our Work', 'About', 'Reviews', 'Free Quote', 'Contact']
    )
  })
})

describe('licensing flags', () => {
  const vuetify = () => new Vuetify()
  const render = (component, site) => mount(component, { localVue, vuetify: vuetify(), propsData: { site } }).text()

  it.each([
    ['hero', HeroSection],
    ['services', ServicesSection],
    ['footer', SiteFooter]
  ])('the %s says nothing about licensing or insurance while unconfirmed', (name, component) => {
    const text = render(component, makeSite({ isLicensed: false, isInsured: null, licenseNumber: 'CBC1' }))
    expect(text).not.toMatch(/licensed|insured|license #/i)
  })

  it.each([
    ['hero', HeroSection],
    ['services', ServicesSection],
    ['footer', SiteFooter]
  ])('the %s shows "Licensed & Insured" once both are confirmed', (name, component) => {
    expect(render(component, makeSite({ isLicensed: true, isInsured: true }))).toContain('Licensed & Insured')
  })

  it('shows the license number in the footer only for a licensed business', () => {
    expect(render(SiteFooter, makeSite({ isLicensed: true, licenseNumber: 'CBC123' }))).toContain('License #CBC123')
    expect(render(SiteFooter, makeSite({ isLicensed: false, licenseNumber: 'CBC123' }))).not.toContain('CBC123')
  })

  it('shows "Insured" alone when only insurance is confirmed', () => {
    const text = render(HeroSection, makeSite({ isLicensed: false, isInsured: true }))
    expect(text).toContain('Insured')
    expect(text).not.toMatch(/licensed/i)
  })
})

describe('content from config', () => {
  const mountWith = (component, site) => mount(component, { localVue, vuetify: new Vuetify(), propsData: { site } })

  it('renders the hero text, trust line and buttons from config', () => {
    const wrapper = mountWith(HeroSection, makeSite())
    expect(wrapper.find('h1').text()).toBe('Repairs in Springfield')
    expect(wrapper.findAll('.hero__trust li').wrappers.map(li => li.text())).toEqual(
      ['Serving the county', 'Free Quotes', '4.6★ Google', '5.0★ Thumbtack']
    )
    expect(wrapper.find('a[href="#quote"]').exists()).toBe(true)
    expect(wrapper.find('a[href="sms:+15550100100"]').exists()).toBe(true)
  })

  it('hides every Text button when smsHref is null', () => {
    const site = makeSite({ smsHref: null })
    expect(mountWith(HeroSection, site).find('a[href^="sms:"]').exists()).toBe(false)
    expect(mountWith(ContactSection, site).find('a[href^="sms:"]').exists()).toBe(false)
    expect(mountWith(SiteFooter, site).find('a[href^="sms:"]').exists()).toBe(false)
  })

  it('renders service groups and the footnote', () => {
    const wrapper = mountWith(ServicesSection, makeSite())
    expect(wrapper.findAll('h3.group__title').wrappers.map(h => h.text())).toEqual(['Repairs', 'Improvements'])
    expect(wrapper.find('.footnote').text()).toBe('Text a photo for a fast answer.')
  })

  it('shows the owner text as paragraphs, with badges and a described photo', () => {
    const wrapper = mountWith(AboutSection, makeSite())
    expect(wrapper.find('h2').text()).toBe('Meet Alex')
    expect(wrapper.findAll('.about__text p').length).toBe(2)
    expect(wrapper.findAll('.badge').length).toBe(2)
    expect(wrapper.find('img').attributes('alt')).toBe('Alex Example, owner of Example Home Services')
  })

  it('shows the street address only when showStreetAddress is true', () => {
    expect(mountWith(ContactSection, makeSite()).text()).not.toContain('1 Example St')
    expect(mountWith(ContactSection, makeSite({ showStreetAddress: true })).text()).toContain('1 Example St')
  })

  it('takes the menu labels and icons from config', () => {
    const wrapper = mount(App, {
      localVue,
      vuetify: new Vuetify(),
      propsData: { site: makeSite({ nav: { services: { label: 'Lawn Care', icon: 'mdi-mower' } } }) },
      stubs: lazyStubs
    })
    const services = wrapper.find('nav.nav a[href="#services"]')
    expect(services.text()).toBe('Lawn Care')
    expect(services.find('.mdi').classes()).toContain('mdi-mower')
  })
})

describe('ReviewsSection.vue', () => {
  const mountReviews = site => mount(ReviewsSection, { localVue, vuetify: new Vuetify(), propsData: { site } })

  it('shows each review verbatim with its source badge and a text star rating', () => {
    const cards = mountReviews(makeSite()).findAll('.review')
    expect(cards.at(0).text()).toContain('Great work.')
    expect(cards.at(0).find('.source').text()).toBe('Google')
    expect(cards.at(1).find('.source').text()).toBe('Thumbtack')
    expect(cards.at(0).find('[role="img"]').attributes('aria-label')).toBe('5 out of 5 stars')
  })

  it('summarises each rating source, linking it only when its URL is set', () => {
    const ratings = mountReviews(makeSite()).findAll('.rating')
    expect(ratings.at(0).element.tagName).toBe('A')
    expect(ratings.at(0).attributes('href')).toBe('https://g.page/example')
    expect(ratings.at(1).element.tagName).toBe('DIV')
    expect(ratings.at(1).text()).toContain('6 reviews')
  })

  it('shows See all / Leave a review only when their URLs are set', () => {
    const withLinks = mountReviews(makeSite())
    expect(withLinks.text()).toContain('See all reviews on Google')
    expect(withLinks.text()).toContain('Leave a review')

    const withoutLinks = mountReviews(makeSite({ googleReviewsUrl: '', googleWriteReviewUrl: ['TO', 'DO'].join('') }))
    expect(withoutLinks.text()).not.toContain('See all reviews')
    expect(withoutLinks.text()).not.toContain('Leave a review')
  })
})

describe('Preview ribbon', () => {
  const badge = site => mountApp(site).find('.preview-badge')

  it('is off by default, so a preview looks finished to the client', () => {
    expect(badge(makeSite({ launchReady: false })).exists()).toBe(false)
  })

  it('shows on a preview build when showPreviewBadge is true', () => {
    const ribbon = badge(makeSite({ launchReady: false, showPreviewBadge: true }))
    expect(ribbon.exists()).toBe(true)
    expect(ribbon.text()).toBe('Preview')
  })

  it('never shows once launchReady is true, even if showPreviewBadge was left on', () => {
    expect(badge(makeSite({ launchReady: true, showPreviewBadge: true })).exists()).toBe(false)
  })
})
