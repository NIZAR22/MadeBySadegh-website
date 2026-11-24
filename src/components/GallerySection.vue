<script>
import SITE from '@site-config'
import BeforeAfterSlider from './BeforeAfterSlider.vue'
import { galleryCategories, asset } from '@/utils/site'

export default {
  name: 'GallerySection',

  components: { BeforeAfterSlider },

  props: {
    site: { type: Object, default: () => SITE }
  },

  data: () => ({
    // '' = all categories
    activeCategory: ''
  }),

  computed: {
    projects () {
      return this.site.projects || []
    },
    // Filter buttons are generated from the categories actually present, so
    // there's never a button that shows nothing
    categories () {
      return galleryCategories(this.projects)
    },
    visibleProjects () {
      return this.activeCategory
        ? this.projects.filter(project => project.category === this.activeCategory)
        : this.projects
    },
    imageSize () {
      return this.site.galleryImageSize || { width: 1200, height: 900 }
    },
    // Optional section wording (site.gallery.title / .lead). Without it the
    // section reads exactly as before, so existing client sites don't change.
    title () {
      return (this.site.gallery && this.site.gallery.title) || 'Recent Projects'
    },
    lead () {
      return (this.site.gallery && this.site.gallery.lead) ||
        'Drag the slider (or use the arrow keys) to compare before and after.'
    },
    // Announced politely to screen readers after a filter change
    resultText () {
      const count = this.visibleProjects.length
      const what = this.activeCategory || 'all categories'
      return `Showing ${count} ${count === 1 ? 'project' : 'projects'} in ${what}`
    }
  },

  methods: {
    asset,
    // A project with both a url and an image is a portfolio entry: a linked
    // screenshot of a live site instead of a before/after slider. Projects
    // without them render as sliders, as they always have.
    isLinkCard (project) {
      return !!(project.url && project.image)
    }
  }
}
</script>

<style scoped>
/* Filter buttons: real <button>s with aria-pressed, so keyboard and screen
   reader users get the same toggle behaviour as mouse users */
.filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin: 0 0 28px;
}

.chip {
  min-height: 44px;
  padding: 8px 18px;
  border-radius: 999px;
  border: 2px solid var(--color-primary);
  background-color: var(--color-surface);
  color: var(--color-primary);
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.chip[aria-pressed='true'] {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

.category {
  display: inline-block;
  margin-top: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-accent-text);
}

/* ---- Portfolio cards (projects with url + image) ----
   Same frame, radius and caption spacing as the before/after slider, so the
   two kinds of card sit together in one grid. */
.link-card {
  margin: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.link-card__shot {
  display: block;
  overflow: hidden;
  border-radius: var(--radius) var(--radius) 0 0;
  background-color: var(--color-background);
}

.link-card__shot img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
  object-position: top;
  transition: transform 0.3s ease;
}

.link-card__shot:hover img {
  transform: scale(1.02);
}

.link-card__caption {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.link-card__title {
  font-family: var(--font-body);
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.link-card__description {
  margin: 8px 0 14px;
  color: var(--color-muted);
}

/* Pushed to the bottom so buttons line up across cards of different length */
.link-card__visit {
  margin-top: auto;
  align-self: flex-start;
}

</style>

<template>
  <section id="projects" class="section" aria-labelledby="projects-title">
    <div class="container-narrow">
      <h2 id="projects-title" class="section-title">{{ title }}</h2>
      <p class="section-lead">{{ lead }}</p>

      <div v-if="categories.length > 1" class="filters" role="group" aria-label="Filter projects by category">
        <button
          type="button"
          class="chip"
          :aria-pressed="activeCategory === '' ? 'true' : 'false'"
          @click="activeCategory = ''"
        >All</button>
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          class="chip"
          :aria-pressed="activeCategory === category ? 'true' : 'false'"
          @click="activeCategory = category"
        >{{ category }}</button>
      </div>

      <p class="sr-only" aria-live="polite">{{ resultText }}</p>

      <ul class="grid" style="--min: 300px; list-style: none; padding: 0; margin: 0;">
        <li
          v-for="(project, index) in visibleProjects"
          :key="`${activeCategory}-${index}-${project.title}`"
          class="card project"
        >
          <!-- Portfolio entry: screenshot plus a "Visit site" link that
               opens in a new tab. The screenshot is clickable for mouse
               users but left out of the tab order (tabindex -1, hidden from
               screen readers), so keyboard and screen-reader users meet one
               clearly named link per project, not two. -->
          <figure v-if="isLinkCard(project)" class="link-card">
            <a
              class="link-card__shot"
              :href="project.url"
              target="_blank"
              rel="noopener noreferrer"
              tabindex="-1"
              aria-hidden="true"
            >
              <img
                :src="asset(project.image)"
                :alt="project.alt || project.title"
                :width="project.width || imageSize.width"
                :height="project.height || imageSize.height"
                loading="lazy"
                decoding="async"
              >
            </a>
            <figcaption class="link-card__caption">
              <p class="link-card__title">{{ project.title }}</p>
              <span class="category">{{ project.category }}</span>
              <p v-if="project.description" class="link-card__description">{{ project.description }}</p>
              <a
                class="btn btn--outline link-card__visit"
                :href="project.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit site
                <span class="mdi mdi-open-in-new" aria-hidden="true"></span>
                <span class="sr-only">: {{ project.title }} (opens in a new tab)</span>
              </a>
            </figcaption>
          </figure>
          <BeforeAfterSlider
            v-else
            :title="project.title"
            :before="asset(project.beforeSrc)"
            :after="asset(project.afterSrc)"
            :alt="project.alt"
            :width="project.width || imageSize.width"
            :height="project.height || imageSize.height"
          >
            <span class="category">{{ project.category }}</span>
          </BeforeAfterSlider>
        </li>
      </ul>
    </div>
  </section>
</template>
