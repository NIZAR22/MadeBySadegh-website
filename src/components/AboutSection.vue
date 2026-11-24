<script>
import SITE from '@site-config'
import { paragraphs, asset, isFilled } from '@/utils/site'

export default {
  name: 'AboutSection',

  props: {
    site: { type: Object, default: () => SITE }
  },

  computed: {
    textParagraphs () {
      return paragraphs(this.site.about.text)
    },
    photo () {
      return asset(this.site.about.photo)
    },
    badges () {
      return this.site.about.badges || []
    },
    // "Meet Luke" reads warmer than the full name; fall back to "Meet the
    // Owner" while the name is unfinished
    heading () {
      const first = isFilled(this.site.ownerName) ? this.site.ownerName.split(' ')[0] : ''
      return first ? `Meet ${first}` : 'Meet the Owner'
    }
  }
}
</script>

<style scoped>
.about {
  display: grid;
  gap: 32px;
  align-items: center;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .about {
    grid-template-columns: minmax(240px, 2fr) 3fr;
  }
}

/* Fixed 4:5 frame with explicit size attributes so nothing jumps while the
   photo loads (layout shift) */
.about__photo {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  display: block;
  height: auto;
}

.about__text p {
  font-size: 1.125rem;
  margin: 0 0 16px;
}

.badges {
  list-style: none;
  padding: 0;
  margin: 24px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-weight: 700;
}

.badge .mdi {
  color: var(--color-accent);
  font-size: 1.25rem;
}
</style>

<template>
  <section id="about" class="section section--surface" aria-labelledby="about-title">
    <div class="container-narrow">
      <h2 id="about-title" class="section-title">{{ heading }}</h2>
      <p v-if="site.yearsExperience" class="section-lead">
        {{ site.yearsExperience }} years of experience
      </p>

      <div class="about">
        <img
          v-if="photo"
          class="about__photo"
          :src="photo"
          :alt="`${site.ownerName}, owner of ${site.businessName}`"
          width="800"
          height="1000"
          loading="lazy"
          decoding="async"
        >
        <div class="about__text">
          <p v-for="(paragraph, index) in textParagraphs" :key="index">{{ paragraph }}</p>

          <ul v-if="badges.length" class="badges">
            <li v-for="(badge, index) in badges" :key="index" class="badge">
              <span class="mdi mdi-check-circle" aria-hidden="true"></span>
              {{ badge }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
