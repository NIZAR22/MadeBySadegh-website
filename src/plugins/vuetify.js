import Vue from 'vue'
// Framework only: vuetify-loader adds the components each template uses,
// so the bundle carries just those components and their styles
import Vuetify from 'vuetify/lib/framework'
import SITE from '@site-config'

Vue.use(Vuetify)

/**
 * Vuetify theme built from site-config.js, so form fields, focus colours and
 * validation messages match the client's brand without editing this file.
 * Only Vuetify's form components use these; the rest of the page uses the
 * CSS custom properties from the same theme values (src/styles/theme.css).
 */
export default new Vuetify({
  theme: {
    options: {
      // Expose theme colours as CSS variables (e.g. var(--v-primary-base))
      customProperties: true
    },
    themes: {
      light: {
        primary: SITE.theme.primary,
        secondary: SITE.theme.text,
        accent: SITE.theme.accent,
        // Status colours are not brand colours; these pass WCAG AA with white text
        error: '#B3261E',
        success: '#2E7D32',
        info: '#1565C0',
        warning: '#8A5300'
      }
    }
  },
  icons: {
    iconfont: 'mdi'
  }
})
