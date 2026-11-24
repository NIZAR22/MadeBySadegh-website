import { mount, createLocalVue } from '@vue/test-utils'
import Vuetify from 'vuetify'
import emailjs from '@emailjs/browser'
import QuoteForm from '@/components/QuoteForm.vue'
import { makeSite } from '../fixtures/site'

const localVue = createLocalVue()

// Stand-in for Google's reCAPTCHA widget: renders nothing and records resets
const recaptchaReset = jest.fn()
const RecaptchaStub = {
  name: 'VueRecaptcha',
  render: h => h('div'),
  methods: { reset: recaptchaReset }
}

const validForm = {
  name: 'Test User',
  phone: '(555) 010-0123',
  email: 'test@example.com',
  contactMethod: 'Text',
  city: 'Riverton',
  address: '',
  projectType: 'Flooring',
  projectSize: 'Small',
  timeline: '',
  message: 'Kitchen floor, about 200 sq ft',
  website: ''
}

// Let awaited promises settle
const flushPromises = () => new Promise(resolve => setTimeout(resolve))

describe('QuoteForm.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    emailjs.send.mockResolvedValue({ status: 200 })
  })

  const mountForm = site => mount(QuoteForm, {
    localVue,
    vuetify: new Vuetify(),
    propsData: { site: site || makeSite() },
    stubs: { VueRecaptcha: RecaptchaStub, PhotoPicker: true },
    attachTo: document.body
  })

  const fillAndTick = async (wrapper, form = {}) => {
    await wrapper.setData({ form: { ...validForm, ...form } })
    wrapper.vm.onCaptchaVerified('token-123')
  }

  const submit = async wrapper => {
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }

  describe('fields from config', () => {
    it('offers the service-area cities plus Other', () => {
      expect(mountForm().vm.cityOptions).toEqual(['Springfield', 'Riverton', 'Other'])
    })

    it('hides the project-size and timing fields when their lists are empty', () => {
      const wrapper = mountForm(makeSite({ quoteForm: { projectSizes: [], timelines: [] } }))
      const text = wrapper.text()
      expect(text).not.toContain('Project size')
      expect(text).not.toContain('When do you need it done?')
    })

    it('has a label for every visible field', () => {
      const wrapper = mountForm()
      wrapper.findAll('input:not([type="hidden"]):not([tabindex="-1"]), textarea').wrappers.forEach(input => {
        const id = input.attributes('id')
        if (input.attributes('type') === 'radio') return // labelled by v-radio's own <label for>
        expect(wrapper.find(`label[for="${id}"]`).exists()).toBe(true)
      })
    })
  })

  describe('sending', () => {
    it('sends every field to EmailJS with the keys from config', async () => {
      const wrapper = mountForm()
      await fillAndTick(wrapper)
      await submit(wrapper)

      expect(emailjs.send).toHaveBeenCalledWith(
        'service_test',
        'template_test',
        expect.objectContaining({
          from_name: 'Test User',
          phone_number: '(555) 010-0123',
          preferred_contact: 'Text',
          city: 'Riverton',
          address: 'Not given',
          project_type: 'Flooring',
          project_size: 'Small',
          timeline: 'Not given',
          'g-recaptcha-response': 'token-123'
        }),
        { publicKey: 'pk_test' }
      )
    })

    it('shows the success message with the phone number as a backup', async () => {
      const wrapper = mountForm()
      await fillAndTick(wrapper)
      await submit(wrapper)

      const success = wrapper.find('[role="status"].notice--success')
      expect(success.text()).toContain('Thanks! We will reply soon.')
      expect(success.find('a[href="tel:+15550100100"]').exists()).toBe(true)
    })

    it('shows the button state while sending', async () => {
      let resolveSend
      emailjs.send.mockReturnValue(new Promise(resolve => { resolveSend = resolve }))
      const wrapper = mountForm()
      await fillAndTick(wrapper)
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      const button = wrapper.find('button[type="submit"]')
      expect(button.text()).toContain('Sending')
      expect(button.attributes('disabled')).toBe('disabled')
      resolveSend({ status: 200 })
      await flushPromises()
    })

    it('shows an error with the phone number when sending fails, and resets reCAPTCHA', async () => {
      emailjs.send.mockRejectedValue({ status: 500 })
      jest.spyOn(console, 'error').mockImplementation(() => {})
      const wrapper = mountForm()
      await fillAndTick(wrapper)
      await submit(wrapper)

      const error = wrapper.find('[role="alert"].notice--error')
      expect(error.text()).toContain('(555) 010-0100')
      expect(error.find('a[href="tel:+15550100100"]').exists()).toBe(true)
      expect(recaptchaReset).toHaveBeenCalled()
    })

    it('does not send when required fields are missing', async () => {
      const wrapper = mountForm()
      await fillAndTick(wrapper, { name: '', city: '' })
      await submit(wrapper)
      expect(emailjs.send).not.toHaveBeenCalled()
    })

    it('requires an email only when Email is the preferred contact method', async () => {
      const wrapper = mountForm()
      await fillAndTick(wrapper, { contactMethod: 'Email', email: '' })
      await submit(wrapper)
      expect(emailjs.send).not.toHaveBeenCalled()

      await fillAndTick(wrapper, { contactMethod: 'Call', email: '' })
      await submit(wrapper)
      expect(emailjs.send).toHaveBeenCalled()
    })

    it('asks for the reCAPTCHA tick before sending', async () => {
      const wrapper = mountForm()
      await wrapper.setData({ form: { ...validForm } })
      await submit(wrapper)

      expect(emailjs.send).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('Please tick "I\'m not a robot"')
    })

    it('silently drops submissions with the honeypot filled (bots), but looks successful', async () => {
      const wrapper = mountForm()
      await fillAndTick(wrapper, { website: 'http://spam.example' })
      await submit(wrapper)

      expect(emailjs.send).not.toHaveBeenCalled()
      expect(wrapper.find('.notice--success').exists()).toBe(true)
    })

    it('hides the honeypot from people and screen readers', () => {
      const honeypot = mountForm().find('.hp')
      expect(honeypot.attributes('aria-hidden')).toBe('true')
      expect(honeypot.find('input').attributes('tabindex')).toBe('-1')
    })
  })

  describe("photoMode 'off'", () => {
    it('shows no photo option at all', () => {
      const wrapper = mountForm()
      expect(wrapper.find('photopicker-stub').exists()).toBe(false)
      expect(wrapper.find('.sms-photos').exists()).toBe(false)
    })
  })

  describe("photoMode 'sms'", () => {
    const smsSite = () => makeSite({ quoteForm: { photoMode: 'sms', smsPhotoBody: 'Photos for my quote:' } })

    it('shows a Text photos button with a pre-filled message and no file input', () => {
      const wrapper = mountForm(smsSite())
      const link = wrapper.find('.sms-photos a')
      expect(link.attributes('href')).toBe('sms:+15550100100?&body=Photos%20for%20my%20quote%3A')
      expect(link.text()).toContain('Text photos of your project')
      expect(wrapper.find('input[type="file"]').exists()).toBe(false)
    })

    it('shows the Text photos button again on the success screen', async () => {
      const wrapper = mountForm(smsSite())
      await fillAndTick(wrapper)
      await submit(wrapper)
      expect(wrapper.find('.notice--success a[href^="sms:"]').exists()).toBe(true)
    })
  })

  describe("photoMode 'emailjs'", () => {
    const emailjsSite = overrides => makeSite({ quoteForm: { photoMode: 'emailjs', ...overrides } })
    const photo = (name, size) => ({ name, dataUrl: 'data:image/jpeg;base64,' + 'A'.repeat(size), bytes: size, width: 10, height: 10 })

    it('shows the photo picker', () => {
      expect(mountForm(emailjsSite()).find('photopicker-stub').exists()).toBe(true)
    })

    it('attaches the photos as photo_1..photo_N', async () => {
      const wrapper = mountForm(emailjsSite())
      await fillAndTick(wrapper)
      await wrapper.setData({ photos: [photo('a.jpg', 100), photo('b.jpg', 100)] })
      await submit(wrapper)

      const params = emailjs.send.mock.calls[0][2]
      expect(params.photo_count).toBe('2')
      expect(params.photo_1).toMatch(/^data:image\/jpeg;base64,/)
      expect(params.photo_2).toBeDefined()
      expect(params.photo_3).toBeUndefined()
    })

    it('refuses to send over the size limit, with a friendly message offering to text instead', async () => {
      const wrapper = mountForm(emailjsSite({ maxRequestBytes: 5000 }))
      await fillAndTick(wrapper)
      await wrapper.setData({ photos: [photo('big.jpg', 6000)] })
      await submit(wrapper)

      expect(emailjs.send).not.toHaveBeenCalled()
      const error = wrapper.find('.notice--error').text()
      expect(error).toContain('Too many or too large photos')
      expect(error).toContain('text them to us at (555) 010-0100')
    })
  })

  describe('preview site without EmailJS keys', () => {
    // Marker built from pieces, like the real config's unfinished values
    const unfinished = ['TO', 'DO EmailJS service ID'].join('')
    const previewSite = overrides => makeSite({
      launchReady: false,
      quoteForm: { emailjsServiceId: unfinished },
      ...overrides
    })
    const noticeText = wrapper => wrapper.find('.notice--info .notice__text').text().replace(/\s+/g, ' ')
    const submitButton = wrapper => wrapper.find('button[type="submit"]')

    it('shows the coming-soon notice with Call and Text buttons before any interaction', () => {
      // Mounted only: nothing typed, nothing submitted
      const wrapper = mountForm(previewSite())
      const notice = wrapper.find('.notice--info')

      expect(notice.exists()).toBe(true)
      expect(noticeText(wrapper)).toBe(
        "Online quotes are coming soon — call or text (555) 010-0100 and we'll get right back to you."
      )
      expect(notice.attributes('role')).toBe('status')
      // At the top of the form: before the first field
      const form = wrapper.find('form').element
      expect(form.firstElementChild.classList.contains('notice--info')).toBe(true)

      const call = notice.find('a.btn[href="tel:+15550100100"]')
      expect(call.exists()).toBe(true)
      expect(call.text()).toContain('Call (555) 010-0100')
      const text = notice.find('a.btn[href^="sms:"]')
      expect(text.exists()).toBe(true)
      expect(text.text()).toContain('Text us')
    })

    it('keeps the fields visible but disables the submit button, labelled "Online quotes coming soon"', () => {
      const wrapper = mountForm(previewSite())
      expect(wrapper.find('form').isVisible()).toBe(true)
      expect(wrapper.find('input[autocomplete="name"]').exists()).toBe(true)
      expect(wrapper.find('textarea').exists()).toBe(true)

      const button = submitButton(wrapper)
      expect(button.attributes('disabled')).toBeDefined()
      expect(button.text()).toBe('Online quotes coming soon')
    })

    it('never calls EmailJS, even if the form is submitted anyway', async () => {
      const wrapper = mountForm(previewSite())
      await wrapper.setData({ form: { ...validForm } })
      await submit(wrapper)

      expect(emailjs.send).not.toHaveBeenCalled()
      expect(wrapper.find('.notice--success').exists()).toBe(false)
      expect(wrapper.find('.notice--error').exists()).toBe(false)
      // Focus goes to the notice that explains what to do instead
      expect(document.activeElement).toBe(wrapper.find('.notice--info').element)
    })

    it('says "call" and offers no Text button when the business takes no texts', () => {
      const wrapper = mountForm(previewSite({ smsHref: null }))
      expect(noticeText(wrapper)).toContain('coming soon — call (555) 010-0100 and')
      expect(wrapper.find('.notice--info a[href^="sms:"]').exists()).toBe(false)
    })

    it("doesn't load reCAPTCHA or ask for the tick, since nothing can be sent", async () => {
      const wrapper = mountForm(previewSite())
      expect(wrapper.vm.recaptchaSiteKey).toBe('')
      await wrapper.setData({ form: { ...validForm } })
      await submit(wrapper)
      expect(wrapper.text()).not.toContain("I'm not a robot")
    })

    it('sends normally on a preview site once the keys are real', async () => {
      const wrapper = mountForm(makeSite({ launchReady: false }))
      expect(wrapper.find('.notice--info').exists()).toBe(false)
      expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
      expect(submitButton(wrapper).text()).toBe('Request My Free Quote')

      await fillAndTick(wrapper)
      await submit(wrapper)
      expect(emailjs.send).toHaveBeenCalled()
    })
  })
})
