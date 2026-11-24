<script>
/**
 * Before/after comparison slider, no libraries.
 *
 * Three ways to move the divider, all driving the same `position` value:
 * - Mouse and touch: pointer events on the photo frame (drag, or tap/click
 *   to jump). touch-action: pan-y keeps vertical page scrolling working on
 *   phones while horizontal drags move the divider.
 * - Keyboard and screen readers: a real <input type="range">, so arrow keys,
 *   Home/End and Page Up/Down work natively and assistive technology
 *   announces it as a slider with a meaningful value.
 */
export default {
  name: 'BeforeAfterSlider',

  props: {
    title: { type: String, required: true },
    before: { type: String, required: true },
    after: { type: String, required: true },
    // Describes the job; "Before:" / "After:" is added in front
    alt: { type: String, default: '' },
    width: { type: Number, default: 1200 },
    height: { type: Number, default: 900 },
    initial: { type: Number, default: 50 }
  },

  data () {
    return {
      // Percentage of the frame width showing the "before" photo
      position: this.initial,
      dragging: false
    }
  },

  computed: {
    // Unique id ties the visually hidden label to the range input
    inputId () {
      return `ba-range-${this._uid}`
    },
    beforeClip () {
      return { clipPath: `inset(0 ${100 - this.position}% 0 0)` }
    },
    handleStyle () {
      return { left: `${this.position}%` }
    },
    frameStyle () {
      return { aspectRatio: `${this.width} / ${this.height}` }
    },
    valueText () {
      return `${this.position}% before photo, ${100 - this.position}% after photo`
    }
  },

  methods: {
    /**
     * Sets the divider from a pointer's horizontal position in the frame
     * @param {number} clientX
     */
    setFromPointer (clientX) {
      const rect = this.$refs.frame.getBoundingClientRect()
      if (!rect.width) return
      const percent = ((clientX - rect.left) / rect.width) * 100
      this.position = Math.round(Math.min(100, Math.max(0, percent)))
    },

    onPointerDown (event) {
      // Only the main mouse button; any touch or pen contact
      if (event.button !== undefined && event.button !== 0) return
      this.dragging = true
      // Pointer capture keeps the drag going if the finger leaves the frame
      if (this.$refs.frame.setPointerCapture && event.pointerId !== undefined) {
        this.$refs.frame.setPointerCapture(event.pointerId)
      }
      this.setFromPointer(event.clientX)
    },

    onPointerMove (event) {
      if (this.dragging) this.setFromPointer(event.clientX)
    },

    onPointerUp (event) {
      this.dragging = false
      if (this.$refs.frame.releasePointerCapture && event && event.pointerId !== undefined) {
        try {
          this.$refs.frame.releasePointerCapture(event.pointerId)
        } catch (error) {
          // Already released (e.g. pointercancel); nothing to do
        }
      }
    }
  }
}
</script>

<style scoped>
.ba {
  margin: 0;
}

.ba__frame {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius) var(--radius) 0 0;
  background-color: var(--color-background);
  cursor: ew-resize;
  touch-action: pan-y;
  user-select: none;
}

/* Keyboard focus is on the hidden range input; show it on the photo, with
   the same accent outline plus dark ring as every other focus indicator
   (theme.css), so it shows on light backgrounds even when the accent alone
   is a mid-tone. */
.ba:focus-within .ba__frame {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
  box-shadow: 0 0 0 5px var(--color-primary);
}

.ba__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.ba__before {
  position: absolute;
  inset: 0;
}

.ba__handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  margin-left: -1.5px;
  background-color: var(--color-on-primary);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.ba__knob {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-accent);
  color: var(--color-on-accent);
  font-size: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

/* "Before" / "After" corner labels on dark chips so they read on any photo */
.ba__tag {
  position: absolute;
  top: 10px;
  padding: 4px 10px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.72);
  color: #FFFFFF;
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  pointer-events: none;
}

.ba__tag--before {
  left: 10px;
}

.ba__tag--after {
  right: 10px;
}

.ba__caption {
  padding: 14px 16px;
}

.ba__title {
  font-family: var(--font-body);
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}
</style>

<template>
  <figure class="ba">
    <div
      ref="frame"
      class="ba__frame"
      :style="frameStyle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- Explicit width/height plus aspect-ratio reserve the space, so the
           page doesn't jump when the lazy-loaded photos arrive -->
      <img
        class="ba__img"
        :src="after"
        :alt="`After: ${alt || title}`"
        :width="width"
        :height="height"
        loading="lazy"
        decoding="async"
        draggable="false"
      >
      <div class="ba__before" :style="beforeClip">
        <img
          class="ba__img"
          :src="before"
          :alt="`Before: ${alt || title}`"
          :width="width"
          :height="height"
          loading="lazy"
          decoding="async"
          draggable="false"
        >
      </div>
      <span class="ba__tag ba__tag--before" aria-hidden="true">Before</span>
      <span class="ba__tag ba__tag--after" aria-hidden="true">After</span>
      <div class="ba__handle" :style="handleStyle" aria-hidden="true">
        <span class="ba__knob"><span class="mdi mdi-arrow-left-right"></span></span>
      </div>
    </div>

    <label class="sr-only" :for="inputId">Compare before and after: {{ title }}</label>
    <input
      :id="inputId"
      v-model.number="position"
      class="sr-only ba__range"
      type="range"
      min="0"
      max="100"
      step="1"
      :aria-valuetext="valueText"
    >

    <figcaption class="ba__caption">
      <p class="ba__title">{{ title }}</p>
      <slot />
    </figcaption>
  </figure>
</template>
