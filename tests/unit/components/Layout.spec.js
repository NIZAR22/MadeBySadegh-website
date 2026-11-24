/**
 * Page layout matching the reference site: header with the menu
 * button on the left and no call button, the navigation drawer, the round
 * floating call button, the contact cards with their small map, and the
 * three-column footer.
 */
import { mount, createLocalVue } from '@vue/test-utils'
import Vuetify from 'vuetify'
import App from '@/App.vue'
import ContactSection from '@/components/ContactSection.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import { contactMap, socialLinks } from '@/utils/site'
import { makeSite } from '../fixtures/site'

const localVue = createLocalVue()

// Marker built from pieces, matching the other specs
const MARK = ['TO', 'DO'].join('')

const lazyStubs = {
  GallerySection: { name: 'GallerySection', render: h => h('section', { attrs: { id: 'projects' } }) },
  FacebookFeed: { name: 'FacebookFeed', render: h => h('section', { attrs: { id: 'facebook' } }) },
  QuoteForm: { name: 'QuoteForm', render: h => h('section', { attrs: { id: 'quote' } }) }
}

const mountApp = (site = makeSite()) => mount(App, {
  localVue,
  vuetify: new Vuetify(),
  propsData: { site },
  stubs: lazyStubs,
  attachTo: document.body
})

const mountWith = (component, site) => mount(component, { localVue, vuetify: new Vuetify(), propsData: { site } })

// Lets $nextTick callbacks (focus moves) run
const tick = () => new Promise(resolve => setTimeout(resolve))

describe('header', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('has no call button or phone link at any width', () => {
    // Both the desktop menu and the menu button are in the markup (CSS picks
    // one by width), so checking the header once covers every width
    const header = mountApp().find('header')
    expect(header.find('a[href^="tel:"]').exists()).toBe(false)
    expect(header.text()).not.toContain('(555) 010-0100')
    expect(header.find('.header-call').exists()).toBe(false)
  })

  it('puts the menu button on the left, before the logo and name', () => {
    const bar = mountApp().find('.site-header__bar').element
    const children = Array.from(bar.children)
    expect(children[0].classList.contains('menu-button')).toBe(true)
    expect(children[1].classList.contains('brand')).toBe(true)
    expect(children[2].tagName).toBe('NAV')
  })

  it('shows the logo, business name and tagline', () => {
    const brand = mountApp().find('.brand')
    expect(brand.find('.brand__name').text()).toBe('Example Home Services')
    expect(brand.find('.brand__tagline').text()).toBe('Your local fixer')
    expect(brand.attributes('href')).toBe('#top')
  })

  it('gives every menu entry an icon from config', () => {
    const links = mountApp().findAll('nav.nav a').wrappers
    expect(links.length).toBe(7)
    links.forEach(link => expect(link.find('.mdi').exists()).toBe(true))
    expect(links[1].find('.mdi').classes()).toContain('mdi-hammer-wrench')
  })

  it('marks the section in view as the current menu entry', async () => {
    const wrapper = mountApp()
    await wrapper.setData({ activeSection: 'reviews' })
    expect(wrapper.find('nav.nav a[href="#reviews"]').attributes('aria-current')).toBe('location')
    expect(wrapper.find('nav.nav a[href="#services"]').attributes('aria-current')).toBeUndefined()
  })
})

describe('navigation drawer', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  const openDrawer = async () => {
    const wrapper = mountApp()
    await wrapper.find('.menu-button').trigger('click')
    await tick()
    return wrapper
  }
  const isOpen = wrapper => wrapper.find('.drawer').classes().includes('drawer--open')

  it('starts closed', () => {
    const wrapper = mountApp()
    expect(isOpen(wrapper)).toBe(false)
    expect(wrapper.find('.menu-button').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.drawer-scrim').exists()).toBe(false)
  })

  it('opens from the menu button with the name, tagline, menu and a Call Now button', async () => {
    const wrapper = await openDrawer()
    expect(isOpen(wrapper)).toBe(true)
    expect(wrapper.find('.menu-button').attributes('aria-expanded')).toBe('true')

    const drawer = wrapper.find('.drawer')
    expect(drawer.attributes('role')).toBe('dialog')
    expect(drawer.attributes('aria-modal')).toBe('true')
    expect(drawer.find('.drawer__name').text()).toBe('Example Home Services')
    expect(drawer.find('.drawer__tagline').text()).toBe('Your local fixer')
    expect(drawer.findAll('.drawer__nav a').length).toBe(7)
    drawer.findAll('.drawer__nav a').wrappers.forEach(link => expect(link.find('.mdi').exists()).toBe(true))

    const call = drawer.find('.drawer__call a')
    expect(call.text()).toBe('Call Now')
    expect(call.attributes('href')).toBe('tel:+15550100100')
    expect(call.classes()).toContain('btn--block')

    // Focus starts inside the drawer, and the page behind can't scroll
    expect(document.activeElement).toBe(wrapper.find('.drawer__close').element)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('closes with the X button and returns focus to the menu button', async () => {
    const wrapper = await openDrawer()
    await wrapper.find('.drawer__close').trigger('click')
    await tick()
    expect(isOpen(wrapper)).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('.menu-button').element)
    expect(document.body.style.overflow).toBe('')
  })

  it('closes when a menu link is tapped', async () => {
    const wrapper = await openDrawer()
    await wrapper.find('.drawer__nav a[href="#reviews"]').trigger('click')
    expect(isOpen(wrapper)).toBe(false)
  })

  it('closes with Escape', async () => {
    const wrapper = await openDrawer()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await tick()
    expect(isOpen(wrapper)).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('.menu-button').element)
  })

  it('closes when the scrim is tapped', async () => {
    const wrapper = await openDrawer()
    await wrapper.find('.drawer-scrim').trigger('click')
    expect(isOpen(wrapper)).toBe(false)
  })

  it('keeps Tab inside the open drawer', async () => {
    const wrapper = await openDrawer()
    const last = wrapper.find('.drawer__call a').element
    last.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    expect(document.activeElement).toBe(wrapper.find('.drawer__close').element)
  })
})

describe('floating call button', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('is a round tel: link with a spoken label', () => {
    const fab = mountApp().find('a.fab-call')
    expect(fab.exists()).toBe(true)
    expect(fab.attributes('href')).toBe('tel:+15550100100')
    expect(fab.attributes('aria-label')).toBe('Call us at (555) 010-0100')
    expect(fab.find('.mdi-phone').exists()).toBe(true)
  })

  it('hides over the quote form and contact sections, and while the drawer is open', async () => {
    const wrapper = mountApp()
    const fab = () => wrapper.find('a.fab-call')
    expect(fab().isVisible()).toBe(true)

    await wrapper.setData({ activeSection: 'quote' })
    expect(fab().isVisible()).toBe(false)
    await wrapper.setData({ activeSection: 'contact' })
    expect(fab().isVisible()).toBe(false)
    await wrapper.setData({ activeSection: 'services', menuOpen: true })
    expect(fab().isVisible()).toBe(false)
    await wrapper.setData({ menuOpen: false })
    expect(fab().isVisible()).toBe(true)
  })
})

describe('contact section', () => {
  const cards = wrapper => wrapper.findAll('.contact-grid > .contact-card')

  it('shows Call Us, Email Us and Based in <city> cards', () => {
    const wrapper = mountWith(ContactSection, makeSite())
    expect(cards(wrapper).length).toBe(3)
    const call = wrapper.find('.contact-card--call')
    expect(call.find('h3').text()).toBe('Call Us')
    expect(call.find('a[href="tel:+15550100100"]').text()).toContain('Click to call')
    const email = wrapper.find('.contact-card--email')
    expect(email.find('h3').text()).toBe('Email Us')
    expect(email.find('a[href="mailto:hello@example.com"]').text()).toContain('Click to email')
    const location = wrapper.find('.contact-card--location')
    expect(location.find('h3').text()).toBe('Based in Springfield, IL')
    expect(location.text()).toContain('We come to you')
    expect(location.text()).toContain('Serving Sangamon County')
  })

  it('adds a small "or text us" link under the phone only when smsHref is set', () => {
    expect(mountWith(ContactSection, makeSite()).find('.contact-card--call a[href^="sms:"]').text()).toBe('or text us')
    expect(mountWith(ContactSection, makeSite({ smsHref: null })).find('.contact-card--call a[href^="sms:"]').exists()).toBe(false)
  })

  it('puts a lazy, titled map inside the location card (no standalone map)', () => {
    const wrapper = mountWith(ContactSection, makeSite())
    const maps = wrapper.findAll('iframe')
    expect(maps.length).toBe(1)
    const map = wrapper.find('.contact-card--location iframe')
    expect(map.attributes('loading')).toBe('lazy')
    expect(map.attributes('title')).toBe('Map of Springfield, IL')
  })

  it('street hidden: town-level map', () => {
    const wrapper = mountWith(ContactSection, makeSite({ showStreetAddress: false }))
    const map = wrapper.find('iframe')
    expect(map.attributes('data-map-mode')).toBe('city')
    expect(map.attributes('src')).toBe('https://maps.google.com/maps?q=Springfield%2C%20IL&z=11&output=embed')
    expect(map.attributes('src')).not.toContain('Example%20St')
  })

  it('ends the location card with the map and then GET DIRECTIONS, with no separate Open in Maps link', () => {
    const card = mountWith(ContactSection, makeSite()).find('.contact-card--location')
    const children = Array.from(card.element.children)
    expect(children[children.length - 2].tagName).toBe('IFRAME')
    expect(children[children.length - 1].classList.contains('v-btn')).toBe(true)
    expect(card.text()).not.toContain('Open in Maps')
    expect(card.findAll('a').length).toBe(1)
  })

  it('street shown: the map uses the full address', () => {
    const wrapper = mountWith(ContactSection, makeSite({ showStreetAddress: true }))
    const map = wrapper.find('iframe')
    expect(map.attributes('data-map-mode')).toBe('address')
    expect(map.attributes('src')).toContain(encodeURIComponent('1 Example St, Springfield, IL 62701'))
  })

  it('falls back to a neutral US map while baseCity is still a placeholder', () => {
    const site = makeSite({ baseCity: `${MARK} City, ST`, showStreetAddress: true })
    const map = contactMap(site)
    expect(map.mode).toBe('neutral')
    expect(map.embedUrl).toBe('https://maps.google.com/maps?ll=39.8283,-98.5795&z=4&output=embed')
    expect(mountWith(ContactSection, site).find('iframe').attributes('title')).toBe('Map of the United States')
  })

  describe('Get Directions button', () => {
    const button = site => mountWith(ContactSection, site).find('.contact-card--location a.v-btn')
    const ADDRESS = '1 Example St, Springfield, IL 62701'

    it('looks like the reference site button: outlined primary v-btn, large, directions icon on the left, under the map', () => {
      const wrapper = mountWith(ContactSection, makeSite())
      const btn = wrapper.find('.contact-card--location a.v-btn')
      expect(btn.classes()).toEqual(expect.arrayContaining(['v-btn--outlined', 'v-size--large', 'primary--text', 'mt-4']))
      expect(btn.find('.v-icon.v-icon--left').classes()).toContain('mdi-directions')
      expect(btn.text()).toContain('Get Directions')
      // Directly after the map
      expect(wrapper.find('iframe').element.nextElementSibling).toBe(btn.element)
    })

    it('opens in a new tab', () => {
      const btn = button(makeSite())
      expect(btn.attributes('target')).toBe('_blank')
      expect(btn.attributes('rel')).toBe('noopener')
    })

    it('street shown: directions to the full street address', () => {
      expect(button(makeSite({ showStreetAddress: true })).attributes('href')).toBe(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS)}`
      )
    })

    it('street hidden: goes to the Google Maps profile, never to the street address', () => {
      const href = button(makeSite({ showStreetAddress: false })).attributes('href')
      expect(href).toBe('https://g.page/example')
      expect(href).not.toContain('Example')
      expect(decodeURIComponent(href)).not.toContain('1 Example St')
    })

    it('street hidden and no profile: directions to baseCity, still without the street', () => {
      const href = button(makeSite({ showStreetAddress: false, googleReviewsUrl: '' })).attributes('href')
      expect(href).toBe(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('Springfield, IL')}`)
      expect(decodeURIComponent(href)).not.toContain('1 Example St')
    })

    it('renders with template placeholders (TODO values) so it shows in the preview', () => {
      const site = makeSite({
        baseCity: `${MARK} City, ST`,
        streetAddress: `${MARK} street address`,
        postalCode: MARK,
        googleReviewsUrl: '',
        showStreetAddress: false
      })
      const href = button(site).attributes('href')
      expect(href).toBe(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${MARK} City, ST`)}`)
      expect(decodeURIComponent(href)).not.toContain('street address')
    })
  })

  it('shows "Connect With Us" with a Facebook button, hidden when facebookUrl is empty', () => {
    const wrapper = mountWith(ContactSection, makeSite())
    const connect = wrapper.find('.connect')
    expect(connect.find('h3').text()).toBe('Connect With Us')
    const button = connect.find('a.btn--facebook')
    expect(button.attributes('href')).toBe('https://www.facebook.com/example')
    expect(button.text()).toContain('Visit Us on Facebook')
    expect(button.find('.mdi-facebook').exists()).toBe(true)

    expect(mountWith(ContactSection, makeSite({ facebookUrl: '' })).find('.connect').exists()).toBe(false)
  })

  it('still shows the Facebook button with a placeholder link, so the template preview shows the layout', () => {
    const url = `https://www.facebook.com/${MARK}-page`
    expect(mountWith(ContactSection, makeSite({ facebookUrl: url })).find('a.btn--facebook').attributes('href')).toBe(url)
  })
})

describe('footer', () => {
  const footer = site => mountWith(SiteFooter, site || makeSite())

  it('has three columns: business, Quick Contact, Service Area + Follow Us', () => {
    const columns = footer().findAll('.footer__grid > div')
    expect(columns.length).toBe(3)
    expect(columns.at(0).find('.footer__name').text()).toBe('Example Home Services')
    expect(columns.at(0).text()).toContain('Repairs and small projects around Springfield.')
    expect(columns.at(1).find('h2').text()).toBe('Quick Contact')
    expect(columns.at(2).findAll('h2').wrappers.map(h => h.text())).toEqual(['Service Area', 'Follow Us'])
  })

  it('lists phone, email and base city with icons in Quick Contact', () => {
    const items = footer().findAll('.footer__grid > div').at(1).findAll('li')
    expect(items.at(0).find('a').attributes('href')).toBe('tel:+15550100100')
    expect(items.at(1).find('a').attributes('href')).toBe('mailto:hello@example.com')
    expect(items.at(2).text()).toBe('Springfield, IL')
    items.wrappers.forEach(item => expect(item.find('.mdi').exists()).toBe(true))
  })

  it('shows the service area towns, dot-separated', () => {
    expect(footer().find('.footer__area').text()).toBe('Springfield · Riverton')
  })

  it('builds round Follow Us buttons from the social list', () => {
    const buttons = footer().findAll('.footer__social a')
    expect(buttons.wrappers.map(a => a.attributes('href'))).toEqual([
      'https://www.facebook.com/example',
      'https://www.instagram.com/example'
    ])
    expect(buttons.at(1).attributes('aria-label')).toBe('Example Home Services on Instagram (opens in a new tab)')
    expect(buttons.at(1).find('.mdi-instagram').exists()).toBe(true)
  })

  it('hides Follow Us when the social list is empty', () => {
    const wrapper = footer(makeSite({ social: [] }))
    expect(wrapper.text()).not.toContain('Follow Us')
    expect(wrapper.find('.footer__social').exists()).toBe(false)
    expect(wrapper.text()).toContain('Service Area')
  })

  it('skips social entries without a name or URL', () => {
    expect(socialLinks(makeSite({ social: [{ name: 'Facebook', url: '' }, { name: '', url: 'https://x.example' }, null] }))).toEqual([])
  })

  it('has the copyright on one side and the service-area summary on the other, and no Explore list', () => {
    const wrapper = footer()
    const bottom = wrapper.findAll('.footer__bottom p')
    expect(bottom.at(0).text()).toBe(`© ${new Date().getFullYear()} Example Home Services. All rights reserved.`)
    expect(bottom.at(1).text()).toBe('Serving Sangamon County')
    expect(wrapper.text()).not.toContain('Explore')
    expect(wrapper.find('nav').exists()).toBe(false)
  })
})
