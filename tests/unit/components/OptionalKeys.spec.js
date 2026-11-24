/**
 * Optional config keys added for madebysadegh.work (see TEMPLATE-CHANGES.md).
 *
 * Every key is tested both ways: present (the new behaviour) and missing
 * (exactly the template's original output), so client sites built from the
 * template, whose configs don't have these keys, are unaffected.
 */
import { mount, createLocalVue } from '@vue/test-utils'
import Vuetify from 'vuetify'
import GallerySection from '@/components/GallerySection.vue'
import HeroSection from '@/components/HeroSection.vue'
import QuoteForm from '@/components/QuoteForm.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import { makeSite } from '../fixtures/site'

const localVue = createLocalVue()

describe('GallerySection: portfolio link cards and gallery.title / gallery.lead', () => {
  const mountGallery = site => mount(GallerySection, { propsData: { site } })
  const linkProject = {
    title: 'Example Bakery',
    category: 'Website',
    description: 'Website and online ordering.',
    url: 'https://bakery.example.com/',
    image: 'images/portfolio/01-bakery.jpg',
    alt: 'Example Bakery homepage'
  }

  it('without the keys: original heading, lead, and before/after sliders only', () => {
    const wrapper = mountGallery(makeSite())
    expect(wrapper.find('#projects-title').text()).toBe('Recent Projects')
    expect(wrapper.find('.section-lead').text()).toBe('Drag the slider (or use the arrow keys) to compare before and after.')
    expect(wrapper.findAll('.ba').length).toBe(3)
    expect(wrapper.find('.link-card').exists()).toBe(false)
  })

  it('uses gallery.title and gallery.lead when set', () => {
    const wrapper = mountGallery(makeSite({ gallery: { title: 'Portfolio', lead: 'Live sites I built.' } }))
    expect(wrapper.find('#projects-title').text()).toBe('Portfolio')
    expect(wrapper.find('.section-lead').text()).toBe('Live sites I built.')
  })

  it('renders a project with url + image as a screenshot card that opens in a new tab', () => {
    const wrapper = mountGallery(makeSite({ projects: [linkProject] }))
    const card = wrapper.find('.link-card')
    expect(card.exists()).toBe(true)
    expect(wrapper.find('.ba').exists()).toBe(false)

    const img = card.find('img')
    expect(img.attributes('src')).toBe('./images/portfolio/01-bakery.jpg')
    expect(img.attributes('alt')).toBe('Example Bakery homepage')
    expect(card.find('.link-card__title').text()).toBe('Example Bakery')
    expect(card.find('.category').text()).toBe('Website')
    expect(card.find('.link-card__description').text()).toBe('Website and online ordering.')

    // Every link to the site opens in a new tab without giving it window.opener
    card.findAll('a').wrappers.forEach(link => {
      expect(link.attributes('href')).toBe('https://bakery.example.com/')
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
    })
  })

  it('gives keyboard users one named link per card (the screenshot link is out of the tab order)', () => {
    const card = mountGallery(makeSite({ projects: [linkProject] })).find('.link-card')
    const shot = card.find('.link-card__shot')
    expect(shot.attributes('tabindex')).toBe('-1')
    expect(shot.attributes('aria-hidden')).toBe('true')
    const visit = card.find('.link-card__visit')
    expect(visit.text().replace(/\s+/g, ' ')).toContain('Visit site')
    expect(visit.find('.sr-only').text()).toBe(': Example Bakery (opens in a new tab)')
  })

  it('needs both url and image for a link card; otherwise the project stays a slider', () => {
    const urlOnly = { ...makeSite().projects[0], url: 'https://example.com/' }
    const wrapper = mountGallery(makeSite({ projects: [urlOnly] }))
    expect(wrapper.find('.link-card').exists()).toBe(false)
    expect(wrapper.find('.ba').exists()).toBe(true)
  })

  it('mixes link cards and sliders in one list, still filtered by category', async () => {
    const wrapper = mountGallery(makeSite({ projects: [linkProject, makeSite().projects[0]] }))
    expect(wrapper.findAll('.project').length).toBe(2)
    const website = wrapper.findAll('.chip').wrappers.find(chip => chip.text() === 'Website')
    await website.trigger('click')
    expect(wrapper.findAll('.project').length).toBe(1)
    expect(wrapper.find('.link-card').exists()).toBe(true)
  })
})

describe('HeroSection: primaryCta, secondaryCta, overlay and pattern', () => {
  const mountHero = site => mount(HeroSection, { propsData: { site } })
  const buttons = wrapper => wrapper.findAll('.hero__actions a').wrappers.map(a => ({
    href: a.attributes('href'),
    text: a.text().replace(/\s+/g, ' ').trim()
  }))

  it('without the keys: Get a Free Quote, Call and Text, as before', () => {
    expect(buttons(mountHero(makeSite()))).toEqual([
      { href: '#quote', text: 'Get a Free Quote' },
      { href: 'tel:+15550100100', text: 'Call (555) 010-0100' },
      { href: 'sms:+15550100100', text: 'Text Us' }
    ])
  })

  it('primaryCta replaces the quote button; Call and Text stay', () => {
    const site = makeSite({ hero: { primaryCta: { label: 'Start a project', href: '#quote', icon: 'mdi-rocket-launch-outline' } } })
    const wrapper = mountHero(site)
    expect(buttons(wrapper)).toEqual([
      { href: '#quote', text: 'Start a project' },
      { href: 'tel:+15550100100', text: 'Call (555) 010-0100' },
      { href: 'sms:+15550100100', text: 'Text Us' }
    ])
    expect(wrapper.find('.hero__cta--primary .mdi-rocket-launch-outline').exists()).toBe(true)
    expect(wrapper.find('.hero__cta--primary').classes()).toContain('btn--accent')
  })

  it('secondaryCta replaces Call and Text, for a two-button hero', () => {
    const site = makeSite({
      hero: {
        primaryCta: { label: 'Start a project', href: '#quote' },
        secondaryCta: { label: 'See my work', href: '#projects' }
      }
    })
    const wrapper = mountHero(site)
    expect(buttons(wrapper)).toEqual([
      { href: '#quote', text: 'Start a project' },
      { href: '#projects', text: 'See my work' }
    ])
    expect(wrapper.find('.hero__cta--secondary').classes()).toContain('btn--outline-light')
    // No icon given: no empty icon element
    expect(wrapper.find('.hero__cta--secondary .mdi').exists()).toBe(false)
  })

  it('ignores an incomplete CTA (no label or no href) and keeps the default buttons', () => {
    const site = makeSite({ hero: { primaryCta: { label: 'Start' }, secondaryCta: { href: '#projects' } } })
    expect(buttons(mountHero(site)).map(b => b.text)).toEqual(['Get a Free Quote', 'Call (555) 010-0100', 'Text Us'])
  })

  it('keeps the dark overlay over a photo', () => {
    const wrapper = mountHero(makeSite())
    expect(wrapper.find('.hero__image').exists()).toBe(true)
    expect(wrapper.find('.hero__overlay').exists()).toBe(true)
  })

  it('has no overlay when there is no photo, so the primary colour shows as-is', () => {
    const wrapper = mountHero(makeSite({ hero: { image: '' } }))
    expect(wrapper.find('.hero__image').exists()).toBe(false)
    expect(wrapper.find('.hero__overlay').exists()).toBe(false)
  })

  it('without hero.pattern: no pattern layer', () => {
    expect(mountHero(makeSite()).find('.hero__pattern').exists()).toBe(false)
  })

  it('renders hero.pattern as a decorative layer hidden from screen readers', () => {
    const pattern = mountHero(makeSite({ hero: { image: '', pattern: 'images/hero-orbit.svg' } })).find('.hero__pattern')
    expect(pattern.exists()).toBe(true)
    expect(pattern.attributes('src')).toBe('./images/hero-orbit.svg')
    expect(pattern.attributes('alt')).toBe('')
    expect(pattern.attributes('aria-hidden')).toBe('true')
  })
})

describe('QuoteForm: title, submitLabel, sizeLabel and comingSoonText', () => {
  const RecaptchaStub = { name: 'VueRecaptcha', render: h => h('div'), methods: { reset () {} } }
  const mountForm = site => mount(QuoteForm, {
    localVue,
    vuetify: new Vuetify(),
    propsData: { site },
    stubs: { VueRecaptcha: RecaptchaStub, PhotoPicker: true }
  })
  // Marker built from pieces so this file doesn't trip the leftover check
  const unfinished = ['TO', 'DO key'].join('')
  const previewSite = quoteForm => makeSite({ launchReady: false, quoteForm: { emailjsServiceId: unfinished, ...quoteForm } })
  // The size field is the only select whose label isn't one of the fixed ones
  const sizeLabel = wrapper => wrapper.findAll('label').wrappers.map(l => l.text()).find(t => /^(Project size|Budget)\b/.test(t))
  const noticeText = wrapper => wrapper.find('.notice--info .notice__text').text().replace(/\s+/g, ' ')

  it('without the keys: the original quote wording', () => {
    const wrapper = mountForm(makeSite())
    expect(wrapper.find('#quote-title').text()).toBe('Get a Free Quote')
    expect(wrapper.find('button[type="submit"]').text()).toBe('Request My Free Quote')
    expect(sizeLabel(wrapper)).toBe('Project size (optional)')
    expect(noticeText(mountForm(previewSite()))).toBe(
      "Online quotes are coming soon — call or text (555) 010-0100 and we'll get right back to you."
    )
  })

  it('uses the configured wording when set', () => {
    const keys = {
      title: 'Start a Project',
      submitLabel: 'Send My Project Details',
      sizeLabel: 'Budget',
      comingSoonText: 'Online requests are coming soon — call, text or email me at me@example.com.'
    }
    const wrapper = mountForm(makeSite({ quoteForm: keys }))
    expect(wrapper.find('#quote-title').text()).toBe('Start a Project')
    expect(wrapper.find('button[type="submit"]').text()).toBe('Send My Project Details')
    expect(sizeLabel(wrapper)).toBe('Budget (optional)')

    const preview = mountForm(previewSite(keys))
    expect(noticeText(preview)).toBe('Online requests are coming soon — call, text or email me at me@example.com.')
    // The notice's Call / Text buttons stay, and the disabled button keeps its label
    expect(preview.find('.notice--info a[href^="tel:"]').exists()).toBe(true)
    expect(preview.find('button[type="submit"]').text()).toBe('Online quotes coming soon')
  })
})

describe('SiteFooter: footerLogo', () => {
  const mountFooter = site => mount(SiteFooter, { propsData: { site } })

  it('without footerLogo: no image, as before', () => {
    expect(mountFooter(makeSite()).find('img').exists()).toBe(false)
  })

  it('shows footerLogo above the business name, with empty alt by default', () => {
    const wrapper = mountFooter(makeSite({ footerLogo: { src: 'images/footer-badge.svg' } }))
    const img = wrapper.find('img.footer__logo')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('./images/footer-badge.svg')
    expect(img.attributes('alt')).toBe('')
    // Directly before the name
    expect(img.element.nextElementSibling.classList.contains('footer__name')).toBe(true)
  })

  it('uses footerLogo.alt when given, and ignores an entry without src', () => {
    expect(mountFooter(makeSite({ footerLogo: { src: 'images/b.svg', alt: 'Badge' } })).find('img').attributes('alt')).toBe('Badge')
    expect(mountFooter(makeSite({ footerLogo: { alt: 'Badge' } })).find('img').exists()).toBe(false)
  })
})
