<script>
import SITE from '@site-config'
import { splitEmail } from '@/utils/format'
import { smsLink, isFilled, enteredLink, facebookPageUrl, contactMap } from '@/utils/site'

/**
 * Contact section, laid out like the reference site's ContactSection:
 * three cards in a row on desktop (Call Us, Email Us, Based in <city> with a
 * small map), stacked on phones, then "Connect With Us" with the Facebook
 * button.
 */
export default {
  name: 'ContactSection',

  props: {
    site: { type: Object, default: () => SITE }
  },

  computed: {
    smsHref () {
      return smsLink(this.site)
    },
    // Shown whenever an address is entered, placeholder or not, so the card
    // layout can be reviewed in the template and previews (check-site.ps1
    // reports a placeholder). Empty hides the card.
    email () {
      return enteredLink(this.site.email)
    },
    emailParts () {
      return splitEmail(this.email)
    },
    // Opening hours sit under the cards once they're filled in
    hasHours () {
      return isFilled(this.site.hours)
    },
    // Street address in the card text, only when the business shows it
    showStreet () {
      return this.site.showStreetAddress === true && isFilled(this.site.streetAddress)
    },
    // Map mode, embed address and links, decided from the config
    // (see contactMap in src/utils/site.js)
    map () {
      return contactMap(this.site)
    },
    facebookUrl () {
      return facebookPageUrl(this.site)
    }
  }
}
</script>

<style scoped>
/* Three equal cards on desktop, one column below 960px (the reference site's md breakpoint) */
.contact-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr;
  align-items: start;
}

@media (min-width: 960px) {
  .contact-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.contact-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 20px;
  background-color: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--color-border);
  overflow-wrap: anywhere;
}

/*
  The Call and Email cards are one big link each (the whole card is the tap
  target, as on the reference site). The small "or text us" link sits outside that
  link, because links can't be nested.
*/
.contact-card__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 4px;
  border-radius: var(--radius);
  color: var(--color-text) !important;
  text-decoration: none;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.contact-card__link:hover {
  background-color: var(--color-background);
  transform: translateY(-3px);
}

.contact-card__icon {
  font-size: 3.5rem;
  line-height: 1;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.contact-card h3 {
  font-size: 1.5rem;
  margin: 0 0 8px;
}

.contact-card__value {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.contact-card__hint {
  color: var(--color-muted);
  margin: 6px 0 0;
}

.contact-card__sms {
  display: inline-block;
  margin-top: 8px;
  font-size: 0.9375rem;
}

/* Small map inside the location card. Fixed height reserves the space
   before the (lazy) iframe loads, so nothing below it jumps. */
.contact-card__map {
  width: 100%;
  height: 200px;
  margin-top: 16px;
  border: 0;
  border-radius: 8px;
  background-color: var(--color-background);
}

.hours {
  text-align: center;
  margin: 24px 0 0;
  font-size: 1.0625rem;
}

.connect {
  text-align: center;
  margin-top: 48px;
}

.connect h3 {
  font-size: 1.5rem;
  margin: 0 0 16px;
}

/*
  Facebook's own blue with white text. 4.2:1, so the label is bold and
  1.25rem (large text, where WCAG AA asks for 3:1), as on the reference site.
*/
.v-application .btn--facebook {
  min-height: 60px;
  padding: 12px 32px;
  background-color: #1877F2;
  color: #FFFFFF;
  font-size: 1.25rem;
  font-weight: 700;
}

.btn--facebook .mdi {
  font-size: 1.75rem;
}
</style>

<template>
  <section id="contact" class="section" aria-labelledby="contact-title">
    <div class="container-narrow">
      <h2 id="contact-title" class="section-title">Contact Us</h2>
      <p class="section-lead">Get in touch with <strong>{{ site.businessName }}</strong></p>

      <div class="contact-grid">
        <!-- CALL US -->
        <div class="contact-card contact-card--call">
          <a class="contact-card__link" :href="site.phoneHref">
            <span class="mdi mdi-phone contact-card__icon" aria-hidden="true"></span>
            <h3>Call Us</h3>
            <p class="contact-card__value">{{ site.phoneDisplay }}</p>
            <p class="contact-card__hint">Click to call</p>
          </a>
          <a v-if="smsHref" class="text-link contact-card__sms" :href="smsHref">or text us</a>
        </div>

        <!-- EMAIL US -->
        <div v-if="email" class="contact-card contact-card--email">
          <a class="contact-card__link" :href="`mailto:${email}`">
            <span class="mdi mdi-email contact-card__icon" aria-hidden="true"></span>
            <h3>Email Us</h3>
            <!-- <wbr> lets long addresses wrap before the @ on phones -->
            <p class="contact-card__value">{{ emailParts[0] }}<wbr>{{ emailParts[1] }}</p>
            <p class="contact-card__hint">Click to email</p>
          </a>
        </div>

        <!-- LOCATION: where the business is based, with a small map -->
        <div class="contact-card contact-card--location">
          <span class="mdi mdi-map-marker contact-card__icon" aria-hidden="true"></span>
          <h3>Based in {{ site.baseCity }}</h3>
          <p class="contact-card__value">We come to you</p>
          <p v-if="showStreet" class="contact-card__hint">{{ site.streetAddress }}, {{ site.baseCity }} {{ site.postalCode }}</p>
          <p class="contact-card__hint">{{ site.serviceAreaSummary }}</p>
          <!--
            title names the map for screen readers; loading="lazy" waits until
            it's near the screen before loading Google Maps. The map mode
            (address / city / neutral) comes from contactMap().
          -->
          <iframe
            class="contact-card__map"
            :data-map-mode="map.mode"
            :title="`Map of ${map.place}`"
            :src="map.embedUrl"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
          <!--
            Directions button below the map, with the same v-btn props as the
            reference site's button (primary, outlined, large, mt-4, icon on
            the left; Vuetify's own uppercase and letter spacing). Always
            shown; where it leads is decided by directionsLink() so the street
            address is only used when showStreetAddress is true. Outlined
            primary text on the card's surface colour is held to 4.5:1 by
            check-site.ps1 (theme.primary on theme.surface).
          -->
          <v-btn
            :href="map.directionsUrl"
            target="_blank"
            rel="noopener"
            color="primary"
            outlined
            large
            class="mt-4"
          >
            <v-icon left>mdi-directions</v-icon>
            Get Directions
            <span class="sr-only">(opens in a new tab)</span>
          </v-btn>
          <!-- No separate "Open in Maps" link: Google's embedded map shows its
               own, as on the reference site, so the card ends with the button -->

        </div>
      </div>

      <p v-if="hasHours" class="hours">
        <span class="mdi mdi-clock-outline" aria-hidden="true"></span>
        <strong>Hours:</strong> {{ site.hours }}
      </p>

      <!-- CONNECT WITH US: hidden when facebookUrl is empty -->
      <div v-if="facebookUrl" class="connect">
        <h3>Connect With Us</h3>
        <a class="btn btn--facebook" :href="facebookUrl" target="_blank" rel="noopener noreferrer">
          <span class="mdi mdi-facebook" aria-hidden="true"></span>
          Visit Us on Facebook
          <span class="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </div>
  </section>
</template>
