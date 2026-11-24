import {
  licensingClaim,
  licenseNumberText,
  trustItems,
  whyChooseUs,
  navItems,
  smsLink,
  photoMode,
  galleryCategories,
  paragraphs,
  asset,
  isFilled,
  previewBadgeOn,
  emailjsKeysFilled
} from '@/utils/site'
import { makeSite } from '../fixtures/site'

describe('licensing', () => {
  it.each([
    [false, null, ''],
    [false, false, ''],
    [false, true, 'Insured'],
    [true, null, 'Licensed'],
    [true, true, 'Licensed & Insured']
  ])('isLicensed=%s, isInsured=%s claims "%s"', (isLicensed, isInsured, expected) => {
    expect(licensingClaim(makeSite({ isLicensed, isInsured }))).toBe(expected)
  })

  it('shows the license number only for a licensed business that entered one', () => {
    expect(licenseNumberText(makeSite({ isLicensed: false, licenseNumber: 'CBC123' }))).toBe('')
    expect(licenseNumberText(makeSite({ isLicensed: true, licenseNumber: '' }))).toBe('')
    expect(licenseNumberText(makeSite({ isLicensed: true, licenseNumber: 'CBC123' }))).toBe('License #CBC123')
  })
})

describe('trustItems', () => {
  it('lists the configured points, then the ratings', () => {
    expect(trustItems(makeSite())).toEqual(['Serving the county', 'Free Quotes', '4.6★ Google', '5.0★ Thumbtack'])
  })

  it('adds the licensing claim only when allowed', () => {
    expect(trustItems(makeSite({ isLicensed: true, isInsured: true }))).toContain('Licensed & Insured')
  })
})

describe('whyChooseUs', () => {
  it('adds a licensing point only when allowed', () => {
    expect(whyChooseUs(makeSite()).map(p => p.title)).toEqual(['On time'])
    expect(whyChooseUs(makeSite({ isInsured: true }))[0].title).toBe('Insured')
  })
})

describe('navItems', () => {
  it('lists Home and every switched-on section in page order', () => {
    expect(navItems(makeSite()).map(i => i.id)).toEqual(['top', 'services', 'projects', 'about', 'reviews', 'quote', 'contact'])
  })

  it('drops switched-off sections, and the gallery when it has no projects', () => {
    const site = makeSite({ modules: { about: false, quoteForm: false }, projects: [] })
    expect(navItems(site).map(i => i.id)).toEqual(['top', 'services', 'reviews', 'contact'])
  })

  it('takes labels and icons from config nav', () => {
    const services = navItems(makeSite({ nav: { services: { label: 'Lawn Care', icon: 'mdi-mower' } } }))[1]
    expect(services).toEqual({ id: 'services', title: 'Lawn Care', icon: 'mdi-mower' })
  })

  it('falls back to generic defaults, and to industryIcon for Services, when config has no nav', () => {
    const items = navItems(makeSite({ nav: null, industryIcon: 'mdi-hammer' }))
    expect(items[0]).toEqual({ id: 'top', title: 'Home', icon: 'mdi-home' })
    expect(items[1]).toEqual({ id: 'services', title: 'Services', icon: 'mdi-hammer' })
    expect(items[2].title).toBe('Our Work')
  })
})

describe('smsLink', () => {
  it('pre-fills an encoded message in a form iPhone and Android both read', () => {
    expect(smsLink(makeSite(), 'Hi & bye')).toBe('sms:+15550100100?&body=Hi%20%26%20bye')
  })

  it('is empty when texting is switched off', () => {
    expect(smsLink(makeSite({ smsHref: null }), 'Hi')).toBe('')
  })
})

describe('photoMode', () => {
  it('passes through valid modes', () => {
    expect(photoMode(makeSite({ quoteForm: { photoMode: 'sms' } }))).toBe('sms')
    expect(photoMode(makeSite({ quoteForm: { photoMode: 'emailjs' } }))).toBe('emailjs')
  })

  it("falls back to 'off' when sms has no number, or the value is unknown", () => {
    expect(photoMode(makeSite({ smsHref: null, quoteForm: { photoMode: 'sms' } }))).toBe('off')
    expect(photoMode(makeSite({ quoteForm: { photoMode: 'fax' } }))).toBe('off')
  })
})

describe('small helpers', () => {
  it('lists gallery categories once each, in first-seen order', () => {
    expect(galleryCategories(makeSite().projects)).toEqual(['Flooring', 'Carpentry'])
  })

  it('splits text into paragraphs at blank lines', () => {
    expect(paragraphs('One\n\n  Two \n\n')).toEqual(['One', 'Two'])
  })

  it('keeps asset paths relative and leaves absolute URLs alone', () => {
    expect(asset('images/a.jpg')).toMatch(/^(\.\/|\/)?images\/a\.jpg$/)
    expect(asset('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
  })

  it('treats values with a to-do marker as unfinished', () => {
    expect(isFilled('Real value')).toBe(true)
    expect(isFilled(['TO', 'DO later'].join(''))).toBe(false)
    expect(isFilled('')).toBe(false)
  })
})

describe('preview mode helpers', () => {
  it('shows the preview ribbon only on a preview build that asks for it', () => {
    expect(previewBadgeOn(makeSite({ launchReady: false, showPreviewBadge: true }))).toBe(true)
    expect(previewBadgeOn(makeSite({ launchReady: false, showPreviewBadge: false }))).toBe(false)
    expect(previewBadgeOn(makeSite({ launchReady: true, showPreviewBadge: true }))).toBe(false)
  })

  it('treats EmailJS keys as ready only when all three are real', () => {
    expect(emailjsKeysFilled(makeSite())).toBe(true)
    expect(emailjsKeysFilled(makeSite({ quoteForm: { emailjsTemplateId: '' } }))).toBe(false)
    expect(emailjsKeysFilled(makeSite({ quoteForm: { emailjsPublicKey: ['TO', 'DO key'].join('') } }))).toBe(false)
  })
})
