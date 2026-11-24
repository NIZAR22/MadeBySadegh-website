<script>
import SITE from '@site-config'
import { trustItems, smsLink, moduleOn, asset } from '@/utils/site'

export default {
  name: 'HeroSection',

  props: {
    site: { type: Object, default: () => SITE }
  },

  computed: {
    // Credibility line: configured points, the licensing claim only when the
    // config flags allow it, then the ratings
    trust () {
      return trustItems(this.site)
    },
    smsHref () {
      return smsLink(this.site)
    },
    quoteOn () {
      return moduleOn(this.site, 'quoteForm')
    },
    image () {
      return asset(this.site.hero.image)
    }
  }
}
</script>

<style scoped>
/*
  Full-width photo with a dark overlay so white text stays readable on any
  photo the client supplies. The section is sized by its content (not 100vh),
  so the headline and buttons are visible without scrolling on phones.
*/
.hero {
  position: relative;
  overflow: hidden;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

/* <img> rather than a CSS background: it can be prioritised as the
   largest element on screen (fetchpriority) and has real alt handling */
.hero__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Overlay in the primary colour; strong enough that white text meets
   WCAG AA over bright patches of any photo */
.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.72) 100%);
}

.hero__content {
  position: relative;
  padding-top: clamp(56px, 10vw, 120px);
  padding-bottom: clamp(56px, 10vw, 120px);
  text-align: center;
}

.v-application .hero__title {
  color: var(--color-on-primary);
  font-size: clamp(2rem, 5.5vw, 3.6rem);
  text-transform: uppercase;
  max-width: 920px;
  margin: 0 auto 18px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.hero__sub {
  max-width: 760px;
  margin: 0 auto 22px;
  font-size: clamp(1.05rem, 2.2vw, 1.3rem);
  line-height: 1.55;
}

/* Credibility points separated by bullets; wraps cleanly on narrow screens */
.hero__trust {
  list-style: none;
  padding: 0;
  margin: 0 auto 32px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 0;
  font-weight: 600;
}

.hero__trust li:not(:last-child)::after {
  content: '•';
  margin: 0 10px;
  color: var(--color-accent);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

@media (max-width: 600px) {
  .hero__actions .btn {
    width: 100%;
  }
}
</style>

<template>
  <section class="hero" aria-labelledby="hero-title">
    <!-- Decorative: the headline says what matters, so the photo has empty alt -->
    <img
      v-if="image"
      class="hero__image"
      :src="image"
      alt=""
      width="1920"
      height="1080"
      fetchpriority="high"
      decoding="async"
    >
    <div class="hero__overlay" aria-hidden="true"></div>

    <div class="container-narrow hero__content">
      <h1 id="hero-title" class="hero__title">{{ site.hero.h1 }}</h1>
      <p class="hero__sub">{{ site.hero.sub }}</p>

      <ul v-if="trust.length" class="hero__trust" aria-label="Why customers choose us">
        <li v-for="(item, index) in trust" :key="index">{{ item }}</li>
      </ul>

      <div class="hero__actions">
        <a v-if="quoteOn" class="btn btn--accent btn--lg" href="#quote">
          <span class="mdi mdi-clipboard-text-outline" aria-hidden="true"></span>
          Get a Free Quote
        </a>
        <a class="btn btn--outline-light btn--lg" :href="site.phoneHref">
          <span class="mdi mdi-phone" aria-hidden="true"></span>
          Call {{ site.phoneDisplay }}
        </a>
        <a v-if="smsHref" class="btn btn--outline-light btn--lg" :href="smsHref">
          <span class="mdi mdi-message-text-outline" aria-hidden="true"></span>
          Text Us
        </a>
      </div>
    </div>
  </section>
</template>
