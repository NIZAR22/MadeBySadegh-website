<script>
import SITE from '@site-config'
import { splitEmail } from '@/utils/format'
import { licensingClaim, licenseNumberText, enteredLink, socialLinks } from '@/utils/site'

/**
 * Footer, laid out like the reference site's Footer: three columns
 * (business, Quick Contact, Service Area + Follow Us), stacked on phones,
 * then a bottom row with the copyright and the service-area line. There's
 * no link list ("Explore"): the header menu covers that.
 */
export default {
  name: 'SiteFooter',

  props: {
    site: { type: Object, default: () => SITE }
  },

  computed: {
    /**
     * Line under the business name: the licensing claim, only when the
     * licensing flags in site-config.js allow it, then the tagline
     * @returns {string} e.g. "Licensed & Insured · Your local fixer"
     */
    trustLine () {
      return [licensingClaim(this.site), this.site.tagline].filter(Boolean).join(' · ')
    },
    licenseText () {
      return licenseNumberText(this.site)
    },
    // Shown whenever an address is entered (placeholders included, see
    // enteredLink); empty hides the line
    email () {
      return enteredLink(this.site.email)
    },
    emailParts () {
      return splitEmail(this.email)
    },
    // Towns served, as one dot-separated line
    serviceArea () {
      return (this.site.serviceArea || []).join(' · ')
    },
    // Round "Follow Us" buttons; an empty list hides the heading too
    social () {
      return socialLinks(this.site)
    },
    year () {
      return new Date().getFullYear()
    }
  }
}
</script>

<style scoped>
/*
  Primary-colour background with an accent top edge, as on the reference site.
  onPrimary on primary is contrast-checked by check-site.ps1.
*/
.footer {
  background-color: var(--color-primary);
  border-top: 4px solid var(--color-accent);
  color: var(--color-on-primary);
  padding: 40px 0 24px;
}

.footer a {
  color: var(--color-on-primary) !important;
}

/* Three columns from 960px (the reference site's md breakpoint), stacked below */
.footer__grid {
  display: grid;
  gap: 32px;
  grid-template-columns: 1fr;
}

@media (min-width: 960px) {
  .footer__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.footer__name {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  text-transform: uppercase;
  margin: 0 0 12px;
}

.footer__trust {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 12px;
}

.footer p {
  margin: 0 0 12px;
}

.footer h2 {
  font-family: var(--font-heading);
  color: var(--color-on-primary);
  font-size: 1.25rem;
  margin: 0 0 12px;
}

.footer ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer li {
  margin: 0 0 8px;
}

/* Contact lines with an icon; links are at least 44px tall for touch */
.footer__contact {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  max-width: 100%;
  font-size: 1.125rem;
  text-decoration: none;
}

.footer__contact span:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
}

a.footer__contact:hover span:last-child,
a.footer__contact:focus-visible span:last-child {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.footer__contact .mdi {
  font-size: 1.5rem;
}

/* Round social icon buttons: an outline in the footer text colour that fills on hover */
.footer__social {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.footer__social a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border: 2px solid var(--color-on-primary);
  border-radius: 50%;
  font-size: 1.75rem;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.footer__social a:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.footer__bottom {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 24px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 1rem;
}

.footer__bottom p {
  margin: 0;
}

/*
  Phones: centred bottom row, and extra space at the very end so the last
  line of the footer can scroll clear of the floating call button
  (64px button + 16px gap + a little air).
*/
@media (max-width: 959px) {
  .footer__bottom {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 767px) {
  .footer {
    padding-bottom: 104px;
  }
}
</style>

<template>
  <footer class="footer">
    <div class="container-narrow">
      <div class="footer__grid">
        <!-- Business name, trust line, short description -->
        <div>
          <p class="footer__name">{{ site.businessName }}</p>
          <p class="footer__trust">{{ trustLine }}</p>
          <p v-if="licenseText">{{ licenseText }}</p>
          <p v-if="site.footerDescription">{{ site.footerDescription }}</p>
        </div>

        <!-- Quick Contact -->
        <div>
          <h2>Quick Contact</h2>
          <ul>
            <li>
              <a class="footer__contact" :href="site.phoneHref">
                <span class="mdi mdi-phone" aria-hidden="true"></span>
                <span>{{ site.phoneDisplay }}</span>
              </a>
            </li>
            <li v-if="email">
              <a class="footer__contact" :href="`mailto:${email}`">
                <span class="mdi mdi-email" aria-hidden="true"></span>
                <span>{{ emailParts[0] }}<wbr>{{ emailParts[1] }}</span>
              </a>
            </li>
            <li>
              <span class="footer__contact">
                <span class="mdi mdi-map-marker" aria-hidden="true"></span>
                <span>{{ site.baseCity }}</span>
              </span>
            </li>
          </ul>
        </div>

        <!-- Service Area, then Follow Us (hidden when there are no profiles) -->
        <div>
          <h2>Service Area</h2>
          <p class="footer__area">{{ serviceArea }}</p>

          <template v-if="social.length">
            <h2>Follow Us</h2>
            <ul class="footer__social">
              <li v-for="profile in social" :key="profile.name">
                <a
                  :href="profile.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="`${site.businessName} on ${profile.name} (opens in a new tab)`"
                >
                  <span :class="['mdi', profile.icon]" aria-hidden="true"></span>
                </a>
              </li>
            </ul>
          </template>
        </div>
      </div>

      <div class="footer__bottom">
        <p>© {{ year }} <strong>{{ site.businessName }}</strong>. All rights reserved.</p>
        <p>{{ site.serviceAreaSummary }}</p>
      </div>
    </div>
  </footer>
</template>
