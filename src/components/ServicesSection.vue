<script>
import SITE from '@site-config'
import { whyChooseUs, isFilled } from '@/utils/site'

export default {
  name: 'ServicesSection',

  props: {
    site: { type: Object, default: () => SITE }
  },

  computed: {
    groups () {
      return this.site.serviceGroups || []
    },
    // Hidden when empty or still unfinished, so a half-written note never shows
    footnote () {
      return isFilled(this.site.servicesFootnote) ? this.site.servicesFootnote : ''
    },
    // The licensing point is only added when the config flags allow it
    reasons () {
      return whyChooseUs(this.site)
    }
  }
}
</script>

<style scoped>
.group + .group {
  margin-top: 40px;
}

.group__title {
  font-size: 1.5rem;
  text-transform: uppercase;
  margin: 0 0 16px;
}

.service {
  display: flex;
  gap: 16px;
  padding: 20px;
}

.service__icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 1.6rem;
}

.service__name {
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 4px;
}

.service__description {
  margin: 0;
  color: var(--color-muted);
}

/* Footnote callout: left accent bar marks it as an aside */
.footnote {
  margin: 32px auto 0;
  max-width: 760px;
  padding: 16px 20px;
  border-left: 4px solid var(--color-accent);
  background-color: var(--color-surface);
  border-radius: 0 var(--radius) var(--radius) 0;
  font-size: 1.0625rem;
  font-weight: 600;
}

.why {
  margin-top: 56px;
}

.why__title {
  text-align: center;
  font-size: 1.75rem;
  text-transform: uppercase;
  margin: 0 0 24px;
}

.reason {
  text-align: center;
  padding: 8px 12px;
}

.reason .mdi {
  font-size: 2.4rem;
  color: var(--color-accent-text);
}

.reason__title {
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 6px 0 4px;
}

.reason__text {
  margin: 0;
  color: var(--color-muted);
}
</style>

<template>
  <section id="services" class="section" aria-labelledby="services-title">
    <div class="container-narrow">
      <h2 id="services-title" class="section-title">Services</h2>
      <p class="section-lead">What {{ site.businessName }} can help you with</p>

      <div v-for="(group, groupIndex) in groups" :key="groupIndex" class="group">
        <h3 class="group__title">{{ group.title }}</h3>
        <ul class="grid" style="--min: 280px; list-style: none; padding: 0; margin: 0;">
          <li v-for="(item, index) in group.items" :key="index" class="card service">
            <span :class="['service__icon', 'mdi', item.icon]" aria-hidden="true"></span>
            <div>
              <h4 class="service__name">{{ item.name }}</h4>
              <p class="service__description">{{ item.description }}</p>
            </div>
          </li>
        </ul>
      </div>

      <p v-if="footnote" class="footnote">{{ footnote }}</p>

      <div v-if="reasons.length" class="why">
        <h3 class="why__title">Why Choose {{ site.businessName }}</h3>
        <ul class="grid" style="--min: 220px; list-style: none; padding: 0; margin: 0;">
          <li v-for="(reason, index) in reasons" :key="index" class="reason">
            <span :class="['mdi', reason.icon]" aria-hidden="true"></span>
            <h4 class="reason__title">{{ reason.title }}</h4>
            <p class="reason__text">{{ reason.description }}</p>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
