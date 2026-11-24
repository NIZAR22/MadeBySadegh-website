<script>
import { compressPhoto, isImageFile, formatBytes } from '@/utils/photos'

/**
 * Photo attachments for the quote form ('emailjs' photo mode).
 *
 * v-model holds the processed photos: [{ name, dataUrl, bytes, width, height }].
 * Photos are resized and re-encoded in the browser as they're added (see
 * src/utils/photos.js for why), so the form only ever holds small JPEGs.
 */
export default {
  name: 'PhotoPicker',

  model: { prop: 'photos', event: 'input' },

  props: {
    photos: { type: Array, default: () => [] },
    maxPhotos: { type: Number, default: 5 },
    maxEdge: { type: Number, default: 1280 },
    quality: { type: Number, default: 0.7 },
    disabled: { type: Boolean, default: false }
  },

  data: () => ({
    processing: false,
    // Friendly problem message (too many, unreadable file), shown and announced
    message: '',
    // Polite status for screen readers ("Photo 2 added", "Photo removed")
    status: ''
  }),

  computed: {
    ids () {
      return {
        choose: `photos-choose-${this._uid}`,
        camera: `photos-camera-${this._uid}`,
        help: `photos-help-${this._uid}`
      }
    },
    remaining () {
      return Math.max(0, this.maxPhotos - this.photos.length)
    },
    totalSize () {
      return formatBytes(this.photos.reduce((sum, photo) => sum + photo.bytes, 0))
    },
    full () {
      return this.remaining === 0
    }
  },

  methods: {
    formatBytes,

    /**
     * Adds the files picked in either input, up to the limit
     * @param {Event} event
     */
    async onFiles (event) {
      const input = event.target
      const files = Array.from(input.files || [])
      // Clear the input so picking the same photo again still fires a change
      input.value = ''
      if (!files.length) return

      this.message = ''
      const added = []
      const problems = []
      let skippedForLimit = 0

      this.processing = true
      try {
        for (const file of files) {
          if (this.photos.length + added.length >= this.maxPhotos) {
            skippedForLimit++
            continue
          }
          if (!isImageFile(file)) {
            problems.push(`"${file.name}" isn't a photo`)
            continue
          }
          try {
            added.push(await compressPhoto(file, { maxEdge: this.maxEdge, quality: this.quality }))
          } catch (error) {
            problems.push(`"${file.name}" couldn't be read (try a JPEG or a screenshot of it)`)
          }
        }
      } finally {
        this.processing = false
      }

      if (added.length) {
        this.$emit('input', [...this.photos, ...added])
        this.status = `${added.length} ${added.length === 1 ? 'photo' : 'photos'} added. ${this.photos.length + added.length} of ${this.maxPhotos} attached.`
      }
      if (skippedForLimit) {
        problems.push(`you can attach up to ${this.maxPhotos} photos, so ${skippedForLimit} ${skippedForLimit === 1 ? 'was' : 'were'} left out`)
      }
      if (problems.length) {
        this.message = `Sorry, ${problems.join('; ')}.`
      }
    },

    /**
     * Removes a photo and keeps keyboard focus somewhere sensible: on the
     * next photo's remove button, or the add button when none are left
     * @param {number} index
     */
    remove (index) {
      const name = this.photos[index].name
      const next = this.photos.filter((photo, i) => i !== index)
      this.$emit('input', next)
      this.message = ''
      this.status = `Removed ${name}. ${next.length} of ${this.maxPhotos} attached.`
      this.$nextTick(() => {
        const buttons = this.$refs.removeButtons || []
        const target = buttons[Math.min(index, buttons.length - 1)]
        if (target) {
          target.focus()
        } else if (this.$refs.chooseInput) {
          this.$refs.chooseInput.focus()
        }
      })
    }
  }
}
</script>

<style scoped>
.photos {
  margin: 8px 0 24px;
  padding: 16px;
  border: 1px dashed var(--color-muted);
  border-radius: var(--radius);
}

.photos__legend {
  font-weight: 700;
  font-size: 1.0625rem;
  padding: 0 6px;
}

.photos__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 8px 0;
}

/* The real file inputs are visually hidden but keep keyboard focus; the
   styled label next to each shows the focus ring instead */
.photos input[type='file']:focus-visible + label {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}

.photos input[type='file']:disabled + label {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Camera button only matters on touch devices */
.camera-only {
  display: none;
}

@media (pointer: coarse) {
  .camera-only {
    display: inline-flex;
  }
}

.thumbs {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
}

.thumb {
  position: relative;
}

.thumb img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}

/* 44px remove button: big enough to hit with a thumb */
.thumb__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid #FFFFFF;
  background-color: rgba(0, 0, 0, 0.78);
  color: #FFFFFF;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.thumb__size {
  display: block;
  font-size: 0.8125rem;
  color: var(--color-muted);
  text-align: center;
}

.photos__message {
  color: #B3261E;
  font-weight: 600;
  margin: 8px 0 0;
}
</style>

<template>
  <fieldset class="photos" :aria-describedby="ids.help">
    <legend class="photos__legend">Photos of the project (optional)</legend>
    <p :id="ids.help" class="muted" style="margin: 0;">
      Up to {{ maxPhotos }} photos. They're shrunk on your device before sending, and location data is removed.
    </p>

    <div class="photos__buttons">
      <input
        :id="ids.choose"
        ref="chooseInput"
        class="sr-only"
        type="file"
        accept="image/*"
        multiple
        :disabled="disabled || processing || full"
        @change="onFiles"
      >
      <label :for="ids.choose" class="btn btn--outline">
        <span class="mdi mdi-image-plus" aria-hidden="true"></span>
        Add photos
      </label>

      <!-- capture opens the camera straight away on phones -->
      <input
        :id="ids.camera"
        class="sr-only camera-only"
        type="file"
        accept="image/*"
        capture="environment"
        :disabled="disabled || processing || full"
        @change="onFiles"
      >
      <label :for="ids.camera" class="btn btn--outline camera-only">
        <span class="mdi mdi-camera" aria-hidden="true"></span>
        Take a photo
      </label>
    </div>

    <p v-if="processing" class="muted" role="status">Preparing photos…</p>
    <p v-if="message" class="photos__message" role="alert">{{ message }}</p>
    <p class="sr-only" aria-live="polite">{{ status }}</p>

    <ul v-if="photos.length" class="thumbs" :aria-label="`${photos.length} of ${maxPhotos} photos attached, ${totalSize}`">
      <li v-for="(photo, index) in photos" :key="`${index}-${photo.name}`" class="thumb">
        <img :src="photo.dataUrl" :alt="`Photo ${index + 1}: ${photo.name}`" :width="photo.width" :height="photo.height">
        <button
          ref="removeButtons"
          type="button"
          class="thumb__remove"
          :aria-label="`Remove photo ${index + 1} (${photo.name})`"
          :disabled="disabled"
          @click="remove(index)"
        >×</button>
        <span class="thumb__size">{{ formatBytes(photo.bytes) }}</span>
      </li>
    </ul>
  </fieldset>
</template>
