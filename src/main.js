import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import './styles/theme.css'
import emailjs from '@emailjs/browser'
import SITE from '@site-config'
import { emailjsKeysFilled } from './utils/config-values'

Vue.config.productionTip = false

// EmailJS only needs initialising when the quote form is on and its keys are
// real. While they're unfinished (a preview build), EmailJS is never touched:
// the form shows a "call or text" message instead (QuoteForm.vue).
// The public key comes from site-config.js (it's public by design: it ships
// in the page). blockHeadless rejects automated (headless) browsers and
// limitRate allows one request per browser every 10 seconds. Both run in the
// browser, so they only stop casual scripts; reCAPTCHA checked by EmailJS
// stops the rest.
if (SITE.modules.quoteForm && emailjsKeysFilled(SITE)) {
  emailjs.init({
    publicKey: SITE.quoteForm.emailjsPublicKey,
    blockHeadless: true,
    limitRate: {
      id: 'quote-form',
      throttle: 10000
    }
  })
}

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
