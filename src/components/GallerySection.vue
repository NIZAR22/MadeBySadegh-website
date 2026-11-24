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
    // Announced politely to screen readers after a filter change
    resultText () {
      const count = this.visibleProjects.length
      const what = this.activeCategory || 'all categories'
      return `Showing ${count} ${count === 1 ? 'project' : 'projects'} in ${what}`
    }
  },

  methods: {
    asset
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

</style>

<template>
  <section id="projects" class="section" aria-labelledby="projects-title">
    <div class="container-narrow">
      <h2 id="projects-title" class="section-title">Recent Projects</h2>
      <p class="section-lead">Drag the slider (or use the arrow keys) to compare before and after.</p>

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
          <BeforeAfterSlider
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
