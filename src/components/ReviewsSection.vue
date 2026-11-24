<script>
import SITE from '@site-config'
import { ratingsToShow, isUsableUrl } from '@/utils/site'

export default {
  name: 'ReviewsSection',

  props: {
    site: { type: Object, default: () => SITE }
  },

  computed: {
    reviews () {
      return this.site.reviews || []
    },
    // One summary per review site; each links to its profile when the URL is set
    ratings () {
      return ratingsToShow(this.site).map(rating => ({
        ...rating,
        href: isUsableUrl(rating.url) ? rating.url : ''
      }))
    },
    // The buttons only appear once their links are real, so the page never
    // sends visitors to a placeholder or the wrong business
    seeAllUrl () {
      return isUsableUrl(this.site.googleReviewsUrl) ? this.site.googleReviewsUrl : ''
    },
    writeReviewUrl () {
      return isUsableUrl(this.site.googleWriteReviewUrl) ? this.site.googleWriteReviewUrl : ''
    }
  },

  methods: {
    /**
     * Whole stars to draw for a rating (rounded to the nearest whole star)
     * @param {string|number} value
     * @returns {number}
     */
    starCount (value) {
      return Math.max(0, Math.min(5, Math.round(Number(value) || 0)))
    }
  }
}
</script>

<style scoped>
.ratings {
  list-style: none;
  padding: 0;
  margin: 0 0 36px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
}

.rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 180px;
  padding: 16px 24px;
  color: var(--color-text) !important;
  text-decoration: none;
}

a.rating:hover {
  border-color: var(--color-accent);
}

.rating__value {
  font-family: var(--font-heading);
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1;
}

.rating__source {
  font-weight: 700;
}

.rating__count {
  font-size: 0.9375rem;
  color: var(--color-muted);
}

/* Stars in the accent text colour: they carry meaning, so they need
   contrast too (the numbers next to them repeat it as text) */
.stars {
  color: var(--color-accent-text);
  font-size: 1.15rem;
  letter-spacing: 1px;
}

.review {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 22px;
  border-top: 4px solid var(--color-accent);
}

.review__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

/* Source badge: which site the review came from */
.source {
  padding: 3px 10px;
  border-radius: 999px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  font-size: 0.8125rem;
  font-weight: 700;
}

.review__quote {
  flex: 1 1 auto;
  margin: 0 0 16px;
  font-size: 1.0625rem;
}

.review__name {
  margin: 0;
  font-weight: 700;
  font-style: normal;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}
</style>

<template>
  <section id="reviews" class="section" aria-labelledby="reviews-title">
    <div class="container-narrow">
      <h2 id="reviews-title" class="section-title">What Customers Say</h2>
      <p class="section-lead">Real reviews from real customers, copied word for word.</p>

      <ul v-if="ratings.length" class="ratings" aria-label="Ratings by review site">
        <li v-for="rating in ratings" :key="rating.source">
          <component
            :is="rating.href ? 'a' : 'div'"
            class="card rating"
            :href="rating.href || null"
            :target="rating.href ? '_blank' : null"
            :rel="rating.href ? 'noopener noreferrer' : null"
          >
            <span class="rating__value">{{ rating.value }}</span>
            <span class="stars" aria-hidden="true">{{ '★'.repeat(starCount(rating.value)) }}</span>
            <span class="rating__source">
              {{ rating.source }}
              <span v-if="rating.href" class="mdi mdi-open-in-new" aria-hidden="true"></span>
            </span>
            <span v-if="rating.count" class="rating__count">{{ rating.count }} reviews</span>
            <span class="sr-only">{{ rating.value }} out of 5 on {{ rating.source }}<template v-if="rating.href">, opens in a new tab</template></span>
          </component>
        </li>
      </ul>

      <ul class="grid" style="--min: 290px; list-style: none; padding: 0; margin: 0;">
        <li v-for="(review, index) in reviews" :key="index">
          <figure class="card review" style="margin: 0;">
            <div class="review__head">
              <span class="stars" role="img" :aria-label="`${review.stars} out of 5 stars`">{{ '★'.repeat(starCount(review.stars)) }}</span>
              <span class="source">{{ review.source }}</span>
            </div>
            <blockquote class="review__quote">“{{ review.quote }}”</blockquote>
            <figcaption>
              <cite class="review__name">{{ review.name }}</cite>
            </figcaption>
          </figure>
        </li>
      </ul>

      <div v-if="seeAllUrl || writeReviewUrl" class="actions">
        <a v-if="seeAllUrl" class="btn btn--outline" :href="seeAllUrl" target="_blank" rel="noopener noreferrer">
          <span class="mdi mdi-google" aria-hidden="true"></span>
          See all reviews on Google
          <span class="sr-only">(opens in a new tab)</span>
        </a>
        <a v-if="writeReviewUrl" class="btn btn--primary" :href="writeReviewUrl" target="_blank" rel="noopener noreferrer">
          <span class="mdi mdi-star-plus-outline" aria-hidden="true"></span>
          Leave a review
          <span class="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </div>
  </section>
</template>
