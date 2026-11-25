import { QUOTE_FIELDS, escapeHtml, detailsHtml, emptyQuoteForm, submittedAt } from '@/utils/quoteEmail'
import { makeSite } from '../fixtures/site'

// Rows of a details table as [label, value-html] pairs
const rows = html => [...html.matchAll(/<tr><td[^>]*>(.*?)<\/td><td[^>]*>(.*?)<\/td><\/tr>/g)]
  .map(match => [match[1], match[2]])

const filledForm = {
  ...emptyQuoteForm(),
  name: 'Test User',
  phone: '(555) 010-0123',
  email: 'test@example.com',
  contactMethod: 'Email',
  city: 'Riverton',
  address: '12 Main St',
  projectType: 'Website',
  projectSize: '$1,000–$2,500',
  timeline: 'Within a month',
  message: 'Need a site'
}

describe('escapeHtml', () => {
  it('escapes the five HTML-special characters', () => {
    expect(escapeHtml('<a href="x" onclick=\'y\'>&</a>'))
      .toBe('&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;')
  })

  it('escapes & first, so existing entities are not double-decoded', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })
})

describe('detailsHtml', () => {
  it('lists every field without its own param, in field order, with config labels', () => {
    const site = makeSite({ quoteForm: { sizeLabel: 'Budget' } })
    expect(rows(detailsHtml(filledForm, site))).toEqual([
      ['Best way to reach you', 'Email'],
      ['City', 'Riverton'],
      ['Street address', '12 Main St'],
      ['Budget', '$1,000–$2,500'],
      ['When they need it done', 'Within a month'],
      ['Project details', 'Need a site']
    ])
  })

  it('leaves out the fields sent as their own params (name, phone, email, project type)', () => {
    const html = detailsHtml(filledForm, makeSite())
    ;['Test User', '(555) 010-0123', 'test@example.com', 'Website'].forEach(value => {
      expect(html).not.toContain(value)
    })
  })

  it('falls back to "Project size" when there is no sizeLabel', () => {
    expect(rows(detailsHtml(filledForm, makeSite())).map(r => r[0])).toContain('Project size')
  })

  it('HTML-escapes every user value', () => {
    const form = {
      ...filledForm,
      city: '<script>alert(1)</script>',
      message: 'Tom & Jerry\'s "shop" <b>now</b>'
    }
    const html = detailsHtml(form, makeSite())
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<b>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('Tom &amp; Jerry&#39;s &quot;shop&quot; &lt;b&gt;now&lt;/b&gt;')
  })

  it('escapes labels too, since some come from config', () => {
    const site = makeSite({ quoteForm: { sizeLabel: 'Size <small>' } })
    expect(detailsHtml(filledForm, site)).toContain('Size &lt;small&gt;')
  })

  it('keeps line breaks in the message as <br>, after escaping', () => {
    const html = detailsHtml({ ...filledForm, message: 'Line one\r\nLine <two>\nthree' }, makeSite())
    expect(html).toContain('Line one<br>Line &lt;two&gt;<br>three')
  })

  it('skips empty and whitespace-only fields', () => {
    const form = { ...filledForm, address: '', timeline: '   ', projectSize: null, message: undefined }
    expect(rows(detailsHtml(form, makeSite())).map(r => r[0])).toEqual(['Best way to reach you', 'City'])
  })

  it('returns an empty string when there is nothing to list', () => {
    const fields = [{ key: 'address', label: 'Street address' }]
    expect(detailsHtml({ address: '' }, makeSite(), fields)).toBe('')
  })

  it('never includes the honeypot', () => {
    expect(detailsHtml({ ...filledForm, website: 'spam.example' }, makeSite())).not.toContain('spam.example')
  })

  it('includes a new field automatically once it is in the field list', () => {
    const fields = [...QUOTE_FIELDS, { key: 'businessName', label: 'Business name' }]
    const form = { ...filledForm, businessName: 'Acme <Co>' }
    expect(rows(detailsHtml(form, makeSite(), fields)).pop()).toEqual(['Business name', 'Acme &lt;Co&gt;'])
    // and the empty form gets it too, ready for v-model
    expect(Object.keys(emptyQuoteForm())).toEqual([...QUOTE_FIELDS.map(f => f.key), 'website'])
  })

  it('styles cells inline: label #5B616B, value #0F2A44, Arial 14px, 6px vertical padding', () => {
    const html = detailsHtml(filledForm, makeSite())
    const [labelStyle, valueStyle] = html.match(/<tr><td style="([^"]*)">.*?<td style="([^"]*)">/).slice(1)
    expect(labelStyle).toContain('color:#5B616B')
    expect(valueStyle).toContain('color:#0F2A44')
    ;[labelStyle, valueStyle].forEach(style => {
      expect(style).toMatch(/font-family:Arial/)
      expect(style).toContain('font-size:14px')
      expect(style).toMatch(/padding:6px /)
    })
  })
})

describe('emptyQuoteForm', () => {
  it('has every field empty except the default contact method, plus the honeypot', () => {
    expect(emptyQuoteForm()).toEqual({
      name: '',
      phone: '',
      email: '',
      contactMethod: 'Call',
      city: '',
      address: '',
      projectType: '',
      projectSize: '',
      timeline: '',
      message: '',
      website: ''
    })
  })

  it('returns a fresh object each time', () => {
    expect(emptyQuoteForm()).not.toBe(emptyQuoteForm())
  })
})

describe('submittedAt', () => {
  it('formats in Eastern time like "Nov 25, 2026 3:42 PM ET"', () => {
    // 20:42 UTC is 3:42 PM EST
    expect(submittedAt(new Date('2026-11-25T20:42:00Z'))).toBe('Nov 25, 2026 3:42 PM ET')
  })

  it('follows daylight saving time', () => {
    // 13:05 UTC in July is 9:05 AM EDT
    expect(submittedAt(new Date('2026-07-04T13:05:00Z'))).toBe('Jul 4, 2026 9:05 AM ET')
  })
})
