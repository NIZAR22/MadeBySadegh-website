<script>
import SITE from '@site-config'
import { smsLink, moduleOn } from '@/utils/site'

export default {
  name: 'ServiceAreaSection',

  props: {
    site: { type: Object, default: () => SITE }
  },

  computed: {
    smsHref () {
      return smsLink(this.site)
    },
    quoteOn () {
      return moduleOn(this.site, 'quoteForm')
    }
  }
}
</script>

<style scoped>
/* Town list as pills: easy to scan, and wraps on any screen width */
.towns {
  list-style: none;
  padding: 0;
  margin: 0 auto;
  max-width: 900px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.town {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  font-weight: 600;
}

.town .mdi {
  color: var(--color-accent-text);
}

.base {
  text-align: center;
  margin: 28px 0 0;
  font-size: 1.0625rem;
}
</style>

<template>
  <section id="service-area" class="section section--surface" aria-labelledby="area-title">
    <div class="container-narrow">
      <h2 id="area-title" class="section-title">Service Area</h2>
      <p class="section-lead">{{ site.serviceAreaSummary }}</p>

      <ul class="towns">
        <li v-for="town in site.serviceArea" :key="town" class="town">
          <span class="mdi mdi-map-marker" aria-hidden="true"></span>
          {{ town }}
        </li>
      </ul>

      <!-- Nearby towns that aren't listed still get an answer -->
      <p class="base muted">
        Based in {{ site.baseCity }}. Don't see your town?
        <a class="text-link" :href="site.phoneHref">Call</a><template v-if="smsHref"> or
          <a class="text-link" :href="smsHref">text</a></template>
        <template v-if="quoteOn"> or <a class="text-link" href="#quote">send a quote request</a></template>
        and ask.
      </p>
    </div>
  </section>
</template>
