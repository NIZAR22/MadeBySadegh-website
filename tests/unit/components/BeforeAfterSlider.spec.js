import { mount } from '@vue/test-utils'
import BeforeAfterSlider from '@/components/BeforeAfterSlider.vue'

const props = {
  title: 'Kitchen floor',
  before: 'before.jpg',
  after: 'after.jpg',
  alt: 'kitchen floor',
  width: 1200,
  height: 900
}

describe('BeforeAfterSlider.vue', () => {
  const mountSlider = (extra = {}) => mount(BeforeAfterSlider, { propsData: { ...props, ...extra } })

  it('starts in the middle and shows that on the photo', () => {
    const wrapper = mountSlider()
    expect(wrapper.find('.ba__before').attributes('style')).toContain('inset(0 50% 0 0)')
    expect(wrapper.find('.ba__handle').attributes('style')).toContain('left: 50%')
  })

  it('has a labelled range input for keyboard and screen reader users', () => {
    const wrapper = mountSlider()
    const input = wrapper.find('input[type="range"]')
    const label = wrapper.find(`label[for="${input.attributes('id')}"]`)

    expect(label.text()).toContain('Kitchen floor')
    expect(input.attributes('aria-valuetext')).toBe('50% before photo, 50% after photo')
  })

  it('moves the divider when the range input changes (arrow keys change the input natively)', async () => {
    const wrapper = mountSlider()
    await wrapper.find('input[type="range"]').setValue(80)

    expect(wrapper.find('.ba__before').attributes('style')).toContain('inset(0 20% 0 0)')
    expect(wrapper.find('input[type="range"]').attributes('aria-valuetext')).toBe('80% before photo, 20% after photo')
  })

  it('moves the divider to where the photo is pressed and follows a drag', async () => {
    const wrapper = mountSlider()
    const frame = wrapper.find('.ba__frame')
    frame.element.getBoundingClientRect = () => ({ left: 100, width: 400, top: 0, height: 300 })

    await frame.trigger('pointerdown', { clientX: 200, button: 0 })
    expect(wrapper.vm.position).toBe(25)

    await frame.trigger('pointermove', { clientX: 400 })
    expect(wrapper.vm.position).toBe(75)

    await frame.trigger('pointerup')
    await frame.trigger('pointermove', { clientX: 150 })
    expect(wrapper.vm.position).toBe(75)
  })

  it('keeps the divider inside the photo', async () => {
    const wrapper = mountSlider()
    const frame = wrapper.find('.ba__frame')
    frame.element.getBoundingClientRect = () => ({ left: 0, width: 400, top: 0, height: 300 })

    await frame.trigger('pointerdown', { clientX: -50, button: 0 })
    expect(wrapper.vm.position).toBe(0)
    await frame.trigger('pointermove', { clientX: 900 })
    expect(wrapper.vm.position).toBe(100)
  })

  it('lazy-loads both photos with explicit sizes and before/after alt text', () => {
    const images = mountSlider().findAll('img')
    expect(images.length).toBe(2)
    images.wrappers.forEach(img => {
      expect(img.attributes('loading')).toBe('lazy')
      expect(img.attributes('width')).toBe('1200')
      expect(img.attributes('height')).toBe('900')
    })
    expect(images.at(0).attributes('alt')).toBe('After: kitchen floor')
    expect(images.at(1).attributes('alt')).toBe('Before: kitchen floor')
  })
})
