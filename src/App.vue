<script>
import SITE from '@site-config'
import HeroSection from './components/HeroSection.vue'
import ServicesSection from './components/ServicesSection.vue'
import ServiceAreaSection from './components/ServiceAreaSection.vue'
import AboutSection from './components/AboutSection.vue'
import ReviewsSection from './components/ReviewsSection.vue'
import ContactSection from './components/ContactSection.vue'
import SiteFooter from './components/SiteFooter.vue'
import { moduleOn, navItems, galleryOn, facebookFeedOn, asset, previewBadgeOn } from './utils/site'

// Below this width the header shows the menu button instead of the row of
// links. Matches the `@media (min-width: 768px)` rules in the styles below.
// 768 rather than Vuetify's 960 so a typical laptop window narrowed to
// 800px still shows the whole menu; the fit check (checkNavFit) covers the
// cases where a long business name plus every section can't fit anyway.
const DESKTOP_MIN_WIDTH = 768

// Sections where the floating call button hides: both have their own call
// buttons, and on phones it would sit on top of the quote form's submit
// button (same rule as the reference site)
const NO_FLOATING_CALL = ['quote', 'contact']

export default {
  name: 'App',

  // Sections further down the page (gallery, Facebook feed, quote form) load
  // in their own files after the page shows, so the first paint only
  // downloads what's above the fold. The quote form brings Vuetify's form
  // components, the heaviest part of the bundle.
  components: {
    HeroSection,
    ServicesSection,
    ServiceAreaSection,
    GallerySection: () => import(/* webpackChunkName: "gallery" */ './components/GallerySection.vue'),
    AboutSection,
    ReviewsSection,
    FacebookFeed: () => import(/* webpackChunkName: "facebook" */ './components/FacebookFeed.vue'),
    QuoteForm: () => import(/* webpackChunkName: "quote-form" */ './components/QuoteForm.vue'),
    ContactSection,
    SiteFooter
  },

  // The config is a prop (defaulting to site-config.js) so tests can render
  // the whole page with modules switched on or off
  props: {
    site: { type: Object, default: () => SITE }
  },

  data: () => ({
    // Phone/tablet menu drawer open or closed
    menuOpen: false,
    // Section currently on screen: underlines its menu entry and decides
    // whether the floating call button shows. Starts on the hero (Home).
    activeSection: 'top',
    // How the desktop menu is drawn, chosen by checkNavFit from what fits
    // beside the logo and name:
    //   'inline'    icon and label side by side (the reference site's look)
    //   'stacked'   icon above a smaller label, narrower, for 768-1100px
    //               windows and sites with every section switched on
    //   'collapsed' neither fits (very long name): the menu button takes over
    navMode: 'inline'
  }),

  computed: {
    nav () {
      return navItems(this.site)
    },
    show () {
      return {
        services: moduleOn(this.site, 'services'),
        serviceArea: moduleOn(this.site, 'serviceArea'),
        gallery: galleryOn(this.site),
        about: moduleOn(this.site, 'about'),
        reviews: moduleOn(this.site, 'reviews') && (this.site.reviews || []).length > 0,
        facebookFeed: facebookFeedOn(this.site),
        quoteForm: moduleOn(this.site, 'quoteForm'),
        contact: moduleOn(this.site, 'contact')
      }
    },
    logoSrc () {
      return asset(this.site.logo && this.site.logo.src)
    },
    // Screen-reader name for the icon-only floating button
    callLabel () {
      return `Call us at ${this.site.phoneDisplay}`
    },
    // Hidden over the quote and contact sections (see NO_FLOATING_CALL) and
    // while the drawer, which has its own Call Now button, is open
    showFloatingCall () {
      return !this.menuOpen && !NO_FLOATING_CALL.includes(this.activeSection)
    },
    // Optional "Preview" ribbon: preview builds with showPreviewBadge only
    showPreviewBadge () {
      return previewBadgeOn(this.site)
    }
  },

  watch: {
    /**
     * While the drawer is open: Escape closes it, Tab stays inside it, and
     * the page behind can't scroll. All undone when it closes.
     */
    menuOpen (open) {
      if (open) {
        document.addEventListener('keydown', this.onKeydown)
        document.body.style.overflow = 'hidden'
        // Focus the close button so keyboard and screen-reader users start
        // inside the drawer
        this.$nextTick(() => {
          if (this.$refs.closeButton) this.$refs.closeButton.focus()
        })
      } else {
        document.removeEventListener('keydown', this.onKeydown)
        document.body.style.overflow = ''
      }
    }
  },

  mounted () {
    // Underline the menu entry of the section in view. IntersectionObserver
    // avoids running code on every scroll event (better on slow phones).
    // The thin band in the middle of the screen decides which section counts
    // as "in view".
    if ('IntersectionObserver' in window) {
      this.sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) this.activeSection = entry.target.id
        })
      }, { rootMargin: '-45% 0px -50% 0px' })
      this.$nextTick(() => this.observeSections())
    }

    // Re-check whether the desktop menu fits whenever the window changes
    // size, and once the web fonts have loaded (they change text widths)
    window.addEventListener('resize', this.onResize)
    this.$nextTick(() => this.checkNavFit())
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => this.checkNavFit())
    }
  },

  updated () {
    // Lazy sections appear after the first render; observe them too
    this.observeSections()
  },

  beforeDestroy () {
    if (this.sectionObserver) this.sectionObserver.disconnect()
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('keydown', this.onKeydown)
    document.body.style.overflow = ''
  },

  methods: {
    observeSections () {
      if (!this.sectionObserver) return
      this.$el.querySelectorAll('section[id]').forEach(section => this.sectionObserver.observe(section))
    },

    /**
     * Whether the desktop menu, drawn in its current mode, fits beside the
     * logo and name. Compares natural widths (scrollWidth ignores shrinking)
     * with the space inside the bar. jsdom reports 0 for every width, so in
     * tests the menu always fits.
     * @returns {boolean}
     */
    navFits () {
      const { bar, brand, nav } = this.$refs
      if (!bar || !brand || !nav) return true
      const style = window.getComputedStyle(bar)
      const available = bar.clientWidth - parseFloat(style.paddingLeft || 0) - parseFloat(style.paddingRight || 0)
      // 24px: the minimum gap between the name and the first menu link
      return brand.scrollWidth + nav.scrollWidth + 24 <= available
    },

    /**
     * Picks the widest menu style that fits: inline, then stacked, then the
     * menu button. Each try re-renders and measures within the same task, so
     * the browser never paints the styles that are tried and dropped.
     * Below DESKTOP_MIN_WIDTH CSS shows the menu button whatever this picks.
     */
    async checkNavFit () {
      // A newer call (e.g. the next resize event) supersedes this one
      const run = (this.navFitRun = (this.navFitRun || 0) + 1)
      for (const mode of ['inline', 'stacked']) {
        this.navMode = mode
        await this.$nextTick()
        if (run !== this.navFitRun) return
        if (this.navFits()) return
      }
      this.navMode = 'collapsed'
    },

    async onResize () {
      await this.checkNavFit()
      // Growing the window to desktop width closes the drawer: its button
      // has disappeared, so nothing on screen could close it otherwise
      if (this.menuOpen && window.innerWidth >= DESKTOP_MIN_WIDTH && this.navMode !== 'collapsed') {
        this.closeMenu({ restoreFocus: false })
      }
    },

    openMenu () {
      this.menuOpen = true
    },

    /**
     * Closes the drawer. Closing with the X button, Escape or the scrim puts
     * focus back on the menu button, so keyboard users carry on where they
     * were. Following a menu link doesn't: the browser moves to the section
     * that link points at.
     * @param {{ restoreFocus?: boolean }} [options]
     */
    closeMenu ({ restoreFocus = true } = {}) {
      if (!this.menuOpen) return
      this.menuOpen = false
      if (restoreFocus) {
        this.$nextTick(() => {
          if (this.$refs.menuButton) this.$refs.menuButton.focus()
        })
      }
    },

    /**
     * Keyboard handling while the drawer is open: Escape closes it, and Tab
     * / Shift+Tab wrap around inside it (it's a modal dialog, so focus must
     * not wander to the page hidden behind the scrim)
     * @param {KeyboardEvent} event
     */
    onKeydown (event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        this.closeMenu()
        return
      }
      if (event.key !== 'Tab' || !this.$refs.drawer) return
      const focusable = Array.from(this.$refs.drawer.querySelectorAll('a[href], button:not([disabled])'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      } else if (!this.$refs.drawer.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      }
    }
  }
}
</script>

<style scoped>
/*
  Header bar, laid out like the reference site's app bar: on phones and
  tablets the menu button on the LEFT, then the logo and name; on wider
  screens the logo, name and tagline on the left and the menu with icons on
  the right. There is no call button in the bar at any size: the floating
  round call button (and the drawer's Call Now) covers that.
  position: sticky (not fixed) keeps it in the page flow, so no content
  hides underneath it.
*/
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.site-header__bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--header-height);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: inherit !important;
  text-decoration: none;
}

.brand__logo {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
}

.brand__text {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.brand__name {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.15;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand__tagline {
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.2;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Menu button: phones and tablets, at the left edge of the bar */
.menu-button {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-left: -8px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-on-primary);
  font-size: 1.75rem;
  cursor: pointer;
}

.menu-button:hover {
  background-color: rgba(255, 255, 255, 0.12);
}

/*
  Desktop menu: icon + label per entry, uppercase like the reference site's text
  buttons. nowrap and flex: none give it one natural width, which the fit
  check measures.
*/
.nav {
  display: none;
  flex: none;
  margin-left: auto;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
}

.nav a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 10px;
  border-radius: 4px;
  color: var(--color-on-primary) !important;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.nav .mdi {
  font-size: 1.25rem;
  line-height: 1;
}

.nav a:hover {
  background-color: rgba(255, 255, 255, 0.12);
}

/* Current section: bold plus an accent underline, so it isn't shown by colour alone */
.nav a[aria-current='location'] {
  font-weight: 800;
  box-shadow: inset 0 -3px 0 var(--color-accent);
}

/* Wide enough: show the menu, hide the menu button */
@media (min-width: 768px) {
  .nav {
    display: flex;
  }

  .menu-button {
    display: none;
  }

  /*
    Stacked: icon above a smaller label. Roughly two thirds the width of
    the inline style, so all seven entries fit beside the name in an 800px
    window. Labels stay bold uppercase at 12px with the icon as a second cue.
  */
  .site-header--stacked .nav a {
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-height: 56px;
    padding: 2px 5px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  .site-header--stacked .nav .mdi {
    font-size: 1.35rem;
  }

  /*
    Wide window but even the stacked menu doesn't fit (very long name):
    back to the menu button. The menu stays laid out, invisible and out of
    the flow, so it never pushes the name off screen.
  */
  .site-header--collapsed .menu-button {
    display: inline-flex;
  }

  .site-header--collapsed .nav {
    position: absolute;
    right: 0;
    visibility: hidden;
    pointer-events: none;
  }
}

/* Very narrow phones: drop the tagline so the name has room */
@media (max-width: 360px) {
  .brand__tagline {
    display: none;
  }
}

/*
  Navigation drawer, sliding in from the left like the reference site's
  v-navigation-drawer: business name and tagline on a primary-colour header
  with a close button, the menu with icons, then a full-width Call Now.
  visibility: hidden while closed takes its links out of the tab order and
  away from screen readers; the delayed visibility transition lets the
  slide-out finish first.
*/
.drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 70;
  width: min(280px, 85vw);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background-color: var(--color-surface);
  color: var(--color-text);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
  transform: translateX(-100%);
  visibility: hidden;
  transition: transform 0.25s ease, visibility 0s linear 0.25s;
}

.drawer--open {
  transform: translateX(0);
  visibility: visible;
  transition: transform 0.25s ease, visibility 0s;
}

.drawer__head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

.drawer__name {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
  text-transform: uppercase;
}

.drawer__tagline {
  font-size: 0.875rem;
  font-weight: 700;
  margin: 4px 0 0;
}

.drawer__close {
  flex: 0 0 auto;
  margin-left: auto;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-on-primary);
  font-size: 1.5rem;
  cursor: pointer;
}

.drawer__close:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.drawer__nav {
  padding: 8px;
  border-bottom: 1px solid var(--color-border);
}

.drawer__nav a {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 52px;
  padding: 0 12px;
  border-radius: 6px;
  color: var(--color-text) !important;
  text-decoration: none;
  font-size: 1.15rem;
  font-weight: 600;
}

.drawer__nav a:hover {
  background-color: var(--color-background);
}

.drawer__nav a[aria-current='location'] {
  background-color: var(--color-background);
  box-shadow: inset 4px 0 0 var(--color-accent);
}

/* Icons in the primary colour, which check-site.ps1 holds to 4.5:1 on surface */
.drawer__nav .mdi {
  font-size: 1.6rem;
  color: var(--color-primary);
}

.drawer__call {
  padding: 16px;
}

/* Dims the page behind the open drawer; tapping it closes the drawer */
.drawer-scrim {
  position: fixed;
  inset: 0;
  z-index: 65;
  background-color: rgba(0, 0, 0, 0.5);
}

/*
  Floating call button, as on the reference site: a round primary-colour button with
  a phone icon in the bottom-right corner, with a gentle pulse to draw the
  eye (the reduced-motion rule in theme.css turns the pulse off for
  visitors who ask for less motion). The safe-area inset keeps it clear of
  the iPhone home bar.
*/
.fab-call {
  position: fixed;
  right: 16px;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: var(--color-on-primary) !important;
  text-decoration: none;
  font-size: 2rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  animation: fab-pulse 2s infinite;
}

.fab-call:hover {
  transform: scale(1.05);
}

@keyframes fab-pulse {
  0% {
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 0 0 rgba(0, 0, 0, 0.35);
  }

  70% {
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 0 14px rgba(0, 0, 0, 0);
  }

  100% {
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 0 0 rgba(0, 0, 0, 0);
  }
}

/*
  "Preview" ribbon: a small pill in the bottom-left corner, away from the
  floating call button. Theme primary/onPrimary colours, a pair
  check-site.ps1 already holds to WCAG AA. pointer-events: none means it can
  never block a tap on whatever is underneath it.
*/
.preview-badge {
  position: fixed;
  left: 12px;
  bottom: 12px;
  z-index: 60;
  padding: 4px 12px;
  border-radius: 999px;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  opacity: 0.92;
  pointer-events: none;
}
</style>

<template>
  <!--
    v-app is required by Vuetify (theme and form components). The page itself
    is plain HTML so it stays light and keyboard-friendly.
  -->
  <v-app>
    <a class="skip-link" href="#main">Skip to content</a>

    <header :class="['site-header', `site-header--${navMode}`]">
      <div ref="bar" class="container-narrow site-header__bar">
        <!-- Phones and tablets: menu button first, on the left (as on the reference site) -->
        <button
          ref="menuButton"
          type="button"
          class="menu-button"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          aria-controls="menu-drawer"
          aria-label="Open menu"
          @click="openMenu"
        >
          <span class="mdi mdi-menu" aria-hidden="true"></span>
        </button>

        <a ref="brand" class="brand" href="#top">
          <img
            v-if="logoSrc"
            class="brand__logo"
            :src="logoSrc"
            :alt="site.logo.alt"
            width="40"
            height="40"
          >
          <span class="brand__text">
            <span class="brand__name">{{ site.businessName }}</span>
            <span class="brand__tagline">{{ site.tagline }}</span>
          </span>
        </a>

        <!-- Desktop menu: plain anchor links, so it works without JavaScript -->
        <nav ref="nav" class="nav" aria-label="Main">
          <a
            v-for="item in nav"
            :key="item.id"
            :href="`#${item.id}`"
            :aria-current="activeSection === item.id ? 'location' : null"
          >
            <span :class="['mdi', item.icon]" aria-hidden="true"></span>
            {{ item.title }}
          </a>
        </nav>
      </div>
    </header>

    <!-- Drawer for phones and tablets: closes with X, Escape, a link or the scrim -->
    <div v-if="menuOpen" class="drawer-scrim" aria-hidden="true" @click="closeMenu()"></div>
    <div
      id="menu-drawer"
      ref="drawer"
      :class="['drawer', { 'drawer--open': menuOpen }]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div class="drawer__head">
        <div>
          <p id="drawer-title" class="drawer__name">{{ site.businessName }}</p>
          <p class="drawer__tagline">{{ site.tagline }}</p>
        </div>
        <button
          ref="closeButton"
          type="button"
          class="drawer__close"
          aria-label="Close menu"
          @click="closeMenu()"
        >
          <span class="mdi mdi-close" aria-hidden="true"></span>
        </button>
      </div>

      <nav class="drawer__nav" aria-label="Menu">
        <a
          v-for="item in nav"
          :key="item.id"
          :href="`#${item.id}`"
          :aria-current="activeSection === item.id ? 'location' : null"
          @click="closeMenu({ restoreFocus: false })"
        >
          <span :class="['mdi', item.icon]" aria-hidden="true"></span>
          {{ item.title }}
        </a>
      </nav>

      <div class="drawer__call">
        <a class="btn btn--primary btn--lg btn--block" :href="site.phoneHref">
          <span class="mdi mdi-phone" aria-hidden="true"></span>
          Call Now
        </a>
      </div>
    </div>

    <main id="main" tabindex="-1">
      <HeroSection id="top" :site="site" />
      <ServicesSection v-if="show.services" :site="site" />
      <ServiceAreaSection v-if="show.serviceArea" :site="site" />
      <GallerySection v-if="show.gallery" :site="site" />
      <AboutSection v-if="show.about" :site="site" />
      <ReviewsSection v-if="show.reviews" :site="site" />
      <FacebookFeed v-if="show.facebookFeed" :site="site" />
      <QuoteForm v-if="show.quoteForm" :site="site" />
      <ContactSection v-if="show.contact" :site="site" />
    </main>

    <SiteFooter :site="site" />

    <!-- Round floating call button, bottom-right (hidden over the quote and contact sections) -->
    <a
      v-show="showFloatingCall"
      class="fab-call"
      :href="site.phoneHref"
      :aria-label="callLabel"
    >
      <span class="mdi mdi-phone" aria-hidden="true"></span>
    </a>

    <!-- Off unless site-config.js asks for it (showPreviewBadge) on a preview build -->
    <div v-if="showPreviewBadge" class="preview-badge">Preview</div>
  </v-app>
</template>
