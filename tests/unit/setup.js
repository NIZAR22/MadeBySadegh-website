import Vue from 'vue'
import Vuetify from 'vuetify'

// Mock EmailJS
jest.mock('@emailjs/browser', () => ({
  init: jest.fn(),
  send: jest.fn()
}))

Vue.use(Vuetify)

// jsdom doesn't implement scrolling; mock the APIs the components call.
// Skipped in specs that run in the Node environment (e.g. the check-script
// spec, which spawns PowerShell), where there's no window at all.
if (typeof window !== 'undefined') {
  window.scrollTo = jest.fn()
  Element.prototype.scrollIntoView = jest.fn()
}
