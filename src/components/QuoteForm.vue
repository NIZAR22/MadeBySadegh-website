<script>
// EmailJS sends the form by email straight from the browser, so the site
// needs no server. Keys come from site-config.js (quoteForm.*).
import emailjs from '@emailjs/browser'
import { VueRecaptcha } from 'vue-recaptcha'
import SITE from '@site-config'
import PhotoPicker from './PhotoPicker.vue'
import { formatPhoneInput } from '@/utils/format'
import { requestBytes } from '@/utils/photos'
import { isFilled, emailjsKeysFilled, photoMode, smsLink } from '@/utils/site'

// How long to wait for Google's reCAPTCHA widget before saying it didn't load
const CAPTCHA_LOAD_TIMEOUT = 15000
// Google's public reCAPTCHA test key: always passes, and works on localhost,
// so local development never needs the client's real key
const RECAPTCHA_TEST_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
// Longest message accepted; long enough for detail, short enough to stay
// well inside EmailJS's request limit alongside photos
const MESSAGE_MAX = 1000

/**
 * Empty form values. A function so every reset gets fresh objects.
 * @returns {object}
 */
function emptyForm () {
  return {
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
    // Honeypot: hidden from people, but bots that fill every field fill it
    website: ''
  }
}

export default {
  name: 'QuoteForm',

  components: { VueRecaptcha, PhotoPicker },

  props: {
    site: { type: Object, default: () => SITE }
  },

  data () {
    return {
      form: emptyForm(),
      photos: [],
      // 'idle' | 'sending' | 'success' | 'error'
      // (A preview site whose EmailJS keys aren't set up isn't a status: it
      // is known before anyone types, so the coming-soon notice and the
      // disabled button come straight from the `connected` computed below.)
      status: 'idle',
      errorMessage: '',
      messageMax: MESSAGE_MAX,

      // reCAPTCHA renders once the form is near the screen (see mounted),
      // so Google's script doesn't load for visitors who never scroll down
      showCaptcha: false,
      captchaReady: false,
      captchaLoadFailed: false,
      captchaRequired: false,
      recaptchaVerified: false,
      recaptchaResponse: '',

      rules: {
        name: [
          v => !!(v && v.trim()) || 'Please enter your name',
          v => (v && v.trim().length >= 2) || 'Name must be at least 2 characters'
        ],
        phone: [
          v => !!v || 'Please enter a phone number',
          v => (v && v.replace(/\D/g, '').length === 10) || 'Phone number must be 10 digits'
        ],
        // Email is only required when it's the preferred way to reply
        email: [
          v => this.form.contactMethod !== 'Email' || !!(v && v.trim()) || 'Please enter your email, or choose Call or Text',
          v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Please enter a valid email'
        ],
        city: [v => !!v || 'Please choose your city'],
        projectType: [v => !!v || 'Please choose a project type'],
        message: [v => !v || v.length <= MESSAGE_MAX || `Please keep it under ${MESSAGE_MAX} characters`]
      }
    }
  },

  computed: {
    q () {
      return this.site.quoteForm
    },
    cityOptions () {
      return [...this.site.serviceArea, 'Other']
    },
    mode () {
      return photoMode(this.site)
    },
    smsPhotosHref () {
      return smsLink(this.site, this.q.smsPhotoBody)
    },
    // Whether the EmailJS keys are all real (no to-do marker, not empty)
    emailjsReady () {
      return emailjsKeysFilled(this.site)
    },
    // Local development uses Google's test key; builds use the client's key.
    // No key at all while EmailJS isn't set up: the form can't send anyway,
    // so Google's script isn't loaded for nothing.
    recaptchaSiteKey () {
      if (!this.emailjsReady) return ''
      if (process.env.NODE_ENV === 'development') return RECAPTCHA_TEST_KEY
      return isFilled(this.q.recaptchaSiteKey) ? this.q.recaptchaSiteKey : ''
    },
    // Whether the form can really send. A launched build already refuses
    // unfinished keys (build/site-build.js); this covers preview builds.
    // When false, the coming-soon notice with Call/Text buttons shows at the
    // top of the form from the first render, and the submit button is
    // disabled, so nobody fills in the whole form only to be told at the end
    // that it can't be sent. The fields stay visible so the client can review
    // the finished layout.
    connected () {
      return this.emailjsReady && !!this.recaptchaSiteKey
    },
    // "call or text" only when the business takes texts (smsHref set)
    reachVerb () {
      return this.site.smsHref ? 'call or text' : 'call'
    },
    sending () {
      return this.status === 'sending'
    },
    submitLabel () {
      if (!this.connected) return 'Online quotes coming soon'
      return this.sending ? 'Sending…' : 'Request My Free Quote'
    }
  },

  watch: {
    showCaptcha (shown) {
      if (shown) {
        this.captchaWait = setTimeout(() => {
          if (!this.captchaReady) this.captchaLoadFailed = true
        }, CAPTCHA_LOAD_TIMEOUT)
      }
    },
    // Re-check the email field when the preferred contact method changes
    'form.contactMethod' () {
      this.$nextTick(() => {
        if (this.$refs.email) this.$refs.email.validate()
      })
    }
  },

  mounted () {
    // Render reCAPTCHA when the form comes within 600px of the screen
    if (!this.recaptchaSiteKey) return
    if ('IntersectionObserver' in window) {
      this.captchaObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          this.showCaptcha = true
          this.captchaObserver.disconnect()
        }
      }, { rootMargin: '600px 0px' })
      this.captchaObserver.observe(this.$el)
    } else {
      this.showCaptcha = true
    }
  },

  beforeDestroy () {
    if (this.captchaObserver) this.captchaObserver.disconnect()
    clearTimeout(this.captchaWait)
  },

  methods: {
    formatPhone () {
      if (this.form.phone) this.form.phone = formatPhoneInput(this.form.phone)
    },

    onCaptchaRendered () {
      this.captchaReady = true
      this.captchaLoadFailed = false
    },
    onCaptchaError () {
      this.captchaLoadFailed = true
    },
    onCaptchaVerified (response) {
      this.recaptchaVerified = true
      this.recaptchaResponse = response
      this.captchaRequired = false
      this.captchaLoadFailed = false
    },
    onCaptchaExpired () {
      this.recaptchaVerified = false
      this.recaptchaResponse = ''
    },
    // A token can only be verified once, so every attempt needs a fresh tick
    resetCaptcha () {
      this.recaptchaVerified = false
      this.recaptchaResponse = ''
      if (this.$refs.recaptcha) this.$refs.recaptcha.reset()
    },

    /**
     * Parameters for the EmailJS template. The names must match the
     * {{variables}} in the client's EmailJS template (listed in SETUP.md).
     * @returns {object}
     */
    templateParams () {
      const f = this.form
      const params = {
        from_name: f.name.trim(),
        reply_to: f.email.trim(),
        phone_number: f.phone,
        preferred_contact: f.contactMethod,
        city: f.city,
        address: f.address.trim() || 'Not given',
        project_type: f.projectType,
        project_size: f.projectSize || 'Not given',
        timeline: f.timeline || 'Not given',
        message: f.message.trim() || 'No details given',
        photo_count: String(this.photos.length),
        'g-recaptcha-response': this.recaptchaResponse
      }
      // Photos as Base64 data URLs: EmailJS "variable attachments" named
      // photo_1 ... photo_N in the template's Attachments tab
      this.photos.forEach((photo, index) => {
        params[`photo_${index + 1}`] = photo.dataUrl
      })
      return params
    },

    /**
     * Shows the error state with the phone number as a fallback
     * @param {string} message
     */
    showError (message) {
      this.status = 'error'
      this.errorMessage = message
      this.$nextTick(() => {
        if (this.$refs.errorBox) this.$refs.errorBox.focus()
      })
    },

    async submit () {
      // Preview site without a working backend. The submit button is
      // disabled, which also blocks pressing Enter in a field, so this is
      // only a safety net (e.g. a script submitting the form): EmailJS is
      // never called (main.js doesn't even initialise it without real keys),
      // and focus goes to the notice that says to call or text instead.
      if (!this.connected) {
        if (this.$refs.comingSoonBox) this.$refs.comingSoonBox.focus()
        return
      }

      // Validate every field; move focus to the first that needs fixing
      if (!this.$refs.form.validate()) {
        const firstInvalid = this.$refs.form.inputs.find(input => input.hasError)
        if (firstInvalid) firstInvalid.focus()
        return
      }

      // Honeypot filled: almost certainly a bot. Pretend it worked so the
      // bot learns nothing, but send nothing.
      if (this.form.website) {
        this.finishSuccess()
        return
      }

      if (!this.recaptchaVerified) {
        this.captchaRequired = true
        return
      }

      const params = this.templateParams()

      // Refuse an oversized request ourselves with a helpful message rather
      // than letting EmailJS reject it with a generic error
      if (this.photos.length) {
        const size = requestBytes({
          service_id: this.q.emailjsServiceId,
          template_id: this.q.emailjsTemplateId,
          user_id: this.q.emailjsPublicKey,
          template_params: params
        })
        if (size > this.q.maxRequestBytes) {
          const textIt = this.site.smsHref ? ` or text them to us at ${this.site.phoneDisplay}` : ''
          this.showError(`Too many or too large photos to send together. Remove one${textIt}.`)
          return
        }
      }

      this.status = 'sending'
      this.errorMessage = ''
      try {
        const response = await emailjs.send(
          this.q.emailjsServiceId,
          this.q.emailjsTemplateId,
          params,
          { publicKey: this.q.emailjsPublicKey }
        )
        if (response && response.status === 200) {
          this.finishSuccess()
        } else {
          throw response
        }
      } catch (error) {
        /* eslint-disable-next-line no-console */
        console.error('EmailJS error:', error)
        // 429 comes from the rate limit in main.js: this browser just sent one
        const message = error && error.status === 429
          ? 'Please wait a few seconds before sending another request.'
          : `Sorry, your request didn't go through. Please call or text ${this.site.phoneDisplay} instead.`
        this.resetCaptcha()
        this.showError(message)
      }
    },

    /**
     * Shows the success panel and clears the form for a possible next request
     */
    finishSuccess () {
      this.status = 'success'
      this.form = emptyForm()
      this.photos = []
      if (this.$refs.form) this.$refs.form.resetValidation()
      this.resetCaptcha()
      // Move focus to the confirmation so keyboard and screen reader users
      // hear it, and scroll it into view on phones
      this.$nextTick(() => {
        if (this.$refs.successBox) {
          this.$refs.successBox.focus()
          if (this.$refs.successBox.scrollIntoView) {
            this.$refs.successBox.scrollIntoView({ block: 'center' })
          }
        }
      })
    },

    startOver () {
      this.status = 'idle'
      this.$nextTick(() => {
        const first = this.$el.querySelector('input')
        if (first) first.focus()
      })
    }
  }
}
</script>

<style scoped>
.form-card {
  max-width: 820px;
  margin: 0 auto;
  padding: clamp(20px, 4vw, 40px);
  border-top: 4px solid var(--color-accent);
}

.row-2 {
  display: grid;
  gap: 0 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 700px) {
  .row-2 {
    grid-template-columns: 1fr 1fr;
  }
}

/* Larger text in fields for easier reading on phones */
.form-card ::v-deep .v-input input,
.form-card ::v-deep .v-input textarea,
.form-card ::v-deep .v-select__selection {
  font-size: 1.0625rem;
}

/* Vuetify's 12px line height is for 12px text; hints at this size need more */
.form-card ::v-deep .v-messages__message {
  font-size: 0.9375rem;
  line-height: 1.35;
}

.form-card ::v-deep .v-messages {
  min-height: 20px;
}

/* Visible text colour for Vuetify hints (its default grey is too light) */
.form-card ::v-deep .v-messages:not(.error--text) {
  color: var(--color-muted);
}

/* Honeypot: off screen for people, still in the form for bots. Not
   display:none, which some bots detect and skip. */
.hp {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.sms-photos {
  margin: 8px 0 24px;
  padding: 16px;
  border: 1px dashed var(--color-muted);
  border-radius: var(--radius);
}

.sms-photos p {
  margin: 0 0 10px;
}

.notice {
  padding: 16px 20px;
  border-radius: var(--radius);
  margin: 0 0 24px;
  font-size: 1.0625rem;
}

.notice:focus {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}

.notice--error {
  background-color: #FDECEA;
  color: #7A1C14;
  border-left: 5px solid #B3261E;
}

/* "Coming soon" on preview sites: theme colours (text on background is
   contrast-checked by check-site.ps1), accent edge so it reads as a note,
   not an error */
.notice--info {
  background-color: var(--color-background);
  color: var(--color-text);
  border-left: 5px solid var(--color-accent);
}

.notice--success {
  background-color: #EAF4EA;
  color: #1B4D1F;
  border-left: 5px solid #2E7D32;
}

/* Plain links in a notice take the notice's text colour (contrast-checked
   for each notice). Buttons are excluded: they keep their own
   contrast-checked colours (e.g. onPrimary on primary). */
.notice a:not(.btn) {
  color: inherit !important;
  font-weight: 700;
}

.notice__text {
  margin: 0 0 12px;
}

.notice__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.notice h3 {
  color: inherit;
  font-size: 1.4rem;
  margin: 0 0 8px;
}

.captcha-help {
  color: #B3261E;
  font-weight: 600;
  margin: 8px 0 0;
}

.required-note {
  margin: 0 0 16px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

/* Disabled "Online quotes coming soon" button. The usual disabled look
   (60% opacity) would drop its text below readable contrast, and here the
   label is the explanation, so it stays fully opaque in muted text (checked
   at 4.5:1 on surface and background) with a dashed edge that reads as
   "not available" rather than as a button to press. */
.v-application .btn--waiting,
.v-application .btn--waiting[disabled] {
  opacity: 1;
  background-color: transparent;
  color: var(--color-muted);
  border: 2px dashed var(--color-muted);
}

.privacy {
  text-align: center;
  margin: 16px 0 0;
  font-size: 0.9375rem;
}

/* Small phones: Google's widget is a fixed 304px, so scale it to fit */
@media (max-width: 360px) {
  .captcha {
    transform: scale(0.88);
    transform-origin: left top;
  }
}
</style>

<template>
  <section id="quote" class="section section--surface" aria-labelledby="quote-title">
    <div class="container-narrow">
      <h2 id="quote-title" class="section-title">Get a Free Quote</h2>
      <p class="section-lead">
        Tell us about your project and we'll get back to you. Prefer to talk?
        Call <a class="text-link" :href="site.phoneHref">{{ site.phoneDisplay }}</a>.
      </p>

      <div class="card form-card">
        <!-- SUCCESS: replaces the form, with the phone number as a backup -->
        <div
          v-if="status === 'success'"
          ref="successBox"
          class="notice notice--success"
          role="status"
          tabindex="-1"
        >
          <h3>Request sent</h3>
          <p>{{ q.successMessage }}</p>
          <p>Need to reach us sooner? Call <a :href="site.phoneHref">{{ site.phoneDisplay }}</a>.</p>
          <p v-if="mode === 'sms'">
            <a class="btn btn--primary" :href="smsPhotosHref">
              <span class="mdi mdi-camera" aria-hidden="true"></span>
              Text photos of your project
            </a>
          </p>
          <button type="button" class="btn btn--outline" @click="startOver">Send another request</button>
        </div>

        <v-form
          v-show="status !== 'success'"
          ref="form"
          @submit.prevent="submit"
        >
          <!-- ERROR: kept above the fields, with the phone number as a fallback -->
          <div
            v-if="status === 'error'"
            ref="errorBox"
            class="notice notice--error"
            role="alert"
            tabindex="-1"
          >
            {{ errorMessage }}
            <a :href="site.phoneHref">{{ site.phoneDisplay }}</a>
          </div>

          <!-- PREVIEW without EmailJS keys: shown from the first render, at
               the top of the form, so visitors know before they start typing.
               role="status" (not "alert"): it's information, not an error.
               The Call/Text buttons are the real way to reach the business
               until the form is connected. -->
          <div
            v-if="!connected"
            ref="comingSoonBox"
            class="notice notice--info"
            role="status"
            tabindex="-1"
          >
            <p class="notice__text">
              Online quotes are coming soon — {{ reachVerb }}
              {{ site.phoneDisplay }} and we'll get right back to you.
            </p>
            <div class="notice__actions">
              <a class="btn btn--primary" :href="site.phoneHref">
                <span class="mdi mdi-phone" aria-hidden="true"></span>
                Call {{ site.phoneDisplay }}
              </a>
              <a v-if="site.smsHref" class="btn btn--outline" :href="site.smsHref">
                <span class="mdi mdi-message-text" aria-hidden="true"></span>
                Text us
              </a>
            </div>
          </div>

          <p class="required-note muted">Fields marked * are required.</p>

          <div class="row-2">
            <v-text-field
              v-model="form.name"
              label="Your name *"
              outlined
              :rules="rules.name"
              autocomplete="name"
              required
            ></v-text-field>
            <v-text-field
              v-model="form.phone"
              label="Phone *"
              type="tel"
              outlined
              :rules="rules.phone"
              autocomplete="tel-national"
              required
              hint="So we can call or text you back"
              @input="formatPhone"
            ></v-text-field>
          </div>

          <v-radio-group
            v-model="form.contactMethod"
            label="Best way to reach you"
            row
            class="mt-0"
          >
            <v-radio label="Call" value="Call"></v-radio>
            <v-radio label="Text" value="Text"></v-radio>
            <v-radio label="Email" value="Email"></v-radio>
          </v-radio-group>

          <v-text-field
            ref="email"
            v-model="form.email"
            :label="form.contactMethod === 'Email' ? 'Email *' : 'Email (optional)'"
            type="email"
            outlined
            :rules="rules.email"
            autocomplete="email"
          ></v-text-field>

          <div class="row-2">
            <v-select
              v-model="form.city"
              :items="cityOptions"
              label="City *"
              outlined
              :rules="rules.city"
              :menu-props="{ offsetY: true }"
            ></v-select>
            <v-text-field
              v-model="form.address"
              label="Street address (optional)"
              outlined
              autocomplete="street-address"
            ></v-text-field>
          </div>

          <div class="row-2">
            <v-select
              v-model="form.projectType"
              :items="q.projectTypes"
              label="Project type *"
              outlined
              :rules="rules.projectType"
              :prepend-inner-icon="site.industryIcon"
              :menu-props="{ offsetY: true }"
            ></v-select>
            <v-select
              v-if="q.projectSizes && q.projectSizes.length"
              v-model="form.projectSize"
              :items="q.projectSizes"
              label="Project size (optional)"
              outlined
              clearable
              :menu-props="{ offsetY: true }"
            ></v-select>
          </div>

          <v-select
            v-if="q.timelines && q.timelines.length"
            v-model="form.timeline"
            :items="q.timelines"
            label="When do you need it done? (optional)"
            outlined
            clearable
            :menu-props="{ offsetY: true }"
          ></v-select>

          <v-textarea
            v-model="form.message"
            label="Project details (optional)"
            outlined
            auto-grow
            rows="4"
            :counter="messageMax"
            :rules="rules.message"
            hint="What needs doing, rough sizes, anything we should know"
          ></v-textarea>

          <!-- Photos: attached in the browser ('emailjs') or texted ('sms') -->
          <PhotoPicker
            v-if="mode === 'emailjs'"
            v-model="photos"
            :max-photos="q.maxPhotos"
            :max-edge="q.photoMaxEdge"
            :quality="q.photoQuality"
            :disabled="sending"
          />
          <div v-else-if="mode === 'sms'" class="sms-photos">
            <p>Have photos? Text them straight to us; it's the quickest way to get an accurate quote.</p>
            <a class="btn btn--outline" :href="smsPhotosHref">
              <span class="mdi mdi-camera" aria-hidden="true"></span>
              Text photos of your project
            </a>
          </div>

          <!-- Honeypot (see .hp): hidden from people and screen readers -->
          <div class="hp" aria-hidden="true">
            <label for="quote-website">Leave this field empty</label>
            <input id="quote-website" v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off">
          </div>

          <div v-if="recaptchaSiteKey" class="mb-4">
            <vue-recaptcha
              v-if="showCaptcha"
              ref="recaptcha"
              class="captcha"
              :sitekey="recaptchaSiteKey"
              @render="onCaptchaRendered"
              @verify="onCaptchaVerified"
              @expired="onCaptchaExpired"
              @error="onCaptchaError"
            />
            <p v-if="captchaRequired" class="captcha-help" role="alert">
              Please tick "I'm not a robot" before sending.
            </p>
            <p v-if="captchaLoadFailed" class="captcha-help" role="alert">
              The spam check couldn't load, so the form can't be sent right now.
              Please call <a :href="site.phoneHref">{{ site.phoneDisplay }}</a>.
            </p>
          </div>

          <div class="actions">
            <!-- Disabled on a preview site that can't send yet; the label
                 says why, and the notice at the top gives the alternative -->
            <button
              type="submit"
              :class="['btn', 'btn--lg', 'btn--block', connected ? 'btn--accent' : 'btn--waiting']"
              :disabled="sending || !connected"
              :aria-busy="sending ? 'true' : 'false'"
            >
              <span :class="['mdi', sending ? 'mdi-loading mdi-spin' : connected ? 'mdi-send' : 'mdi-clock-outline']" aria-hidden="true"></span>
              {{ submitLabel }}
            </button>
            <p class="sr-only" aria-live="polite">{{ sending ? 'Sending your request' : '' }}</p>
          </div>

          <p class="privacy muted">We only use your details to reply to your request.</p>
        </v-form>
      </div>
    </div>
  </section>
</template>
