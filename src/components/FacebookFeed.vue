<script>
import SITE from '@site-config'

// How long to wait for Facebook's plugin before showing the fallback card.
// Privacy extensions and some browsers block it silently (no error event).
const LOAD_TIMEOUT = 10000

export default {
  name: 'FacebookFeed',

  props: {
    site: { type: Object, default: () => SITE }
  },

  data: () => ({
    // The iframe is only added once the section is near the screen, so
    // Facebook's heavy plugin never slows down the first paint
    load: false,
    loaded: false,
    failed: false,
    // Plugin width in px, measured from the column when loading starts.
    // Facebook draws its content at this width (180-500 allowed); a fixed
    // 500 would be cut off on phones.
    frameWidth: 500
  }),

  computed: {
    /**
     * Facebook Page Plugin address, drawn at the measured column width
     * @returns {string}
     */
    pluginUrl () {
      const params = new URLSearchParams({
        href: this.site.facebookUrl,
        tabs: 'timeline',
        width: String(this.frameWidth),
        height: '600',
        small_header: 'true',
        adapt_container_width: 'true',
        hide_cover: 'false',
        show_facepile: 'false'
      })
      return `https://www.facebook.com/plugins/page.php?${params.toString()}`
    }
  },

  mounted () {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          this.startLoading()
          this.observer.disconnect()
        }
      }, { rootMargin: '300px 0px' })
      this.observer.observe(this.$el)
    } else {
      this.startLoading()
    }
  },

  beforeDestroy () {
    if (this.observer) this.observer.disconnect()
    clearTimeout(this.timer)
  },

  methods: {
    startLoading () {
      const column = this.$refs.feed ? this.$refs.feed.clientWidth : 500
      this.frameWidth = Math.max(180, Math.min(500, Math.floor(column) || 500))
      this.load = true
      this.timer = setTimeout(() => {
        if (!this.loaded) this.failed = true
      }, LOAD_TIMEOUT)
    },

    onLoad () {
      this.loaded = true
      clearTimeout(this.timer)
    }
  }
}
</script>

<style scoped>
.feed {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
  justify-items: center;
}

@media (min-width: 900px) {
  .feed {
    grid-template-columns: 500px 1fr;
    align-items: start;
  }
}

/* Reserves the plugin's height up front so the page doesn't jump */
.feed__frame {
  width: 100%;
  max-width: 500px;
  height: 600px;
  border: 0;
  border-radius: var(--radius);
  background-color: var(--color-surface);
}

.fallback {
  width: 100%;
  max-width: 500px;
  padding: 28px;
  text-align: center;
}

.fallback .mdi-facebook {
  font-size: 3rem;
  color: var(--color-primary);
}

.fallback h3 {
  font-size: 1.4rem;
  margin: 8px 0;
}
</style>

<template>
  <section id="facebook" class="section section--surface" aria-labelledby="facebook-title">
    <div class="container-narrow">
      <h2 id="facebook-title" class="section-title">Latest on Facebook</h2>
      <p class="section-lead">Recent jobs and updates from {{ site.businessName }}.</p>

      <div ref="feed" class="feed">
        <iframe
          v-if="load && !failed"
          class="feed__frame"
          :style="{ width: frameWidth + 'px' }"
          :src="pluginUrl"
          :title="`Facebook posts from ${site.businessName}`"
          loading="lazy"
          scrolling="no"
          allow="encrypted-media"
          @load="onLoad"
        ></iframe>

        <!-- Always present: the way to the page if the plugin is blocked,
             and the Follow button for everyone -->
        <div class="card fallback">
          <span class="mdi mdi-facebook" aria-hidden="true"></span>
          <h3>{{ site.businessName }} on Facebook</h3>
          <p v-if="failed" class="muted" role="status">
            The Facebook feed couldn't load here (it's often blocked by privacy settings).
            You can still see every post on the page itself.
          </p>
          <p v-else class="muted">See photos of recent work and follow for updates.</p>
          <a class="btn btn--primary" :href="site.facebookUrl" target="_blank" rel="noopener noreferrer">
            <span class="mdi mdi-facebook" aria-hidden="true"></span>
            Follow on Facebook
            <span class="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
