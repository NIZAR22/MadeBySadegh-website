import { mount } from '@vue/test-utils'
import PhotoPicker from '@/components/PhotoPicker.vue'
import { compressPhoto } from '@/utils/photos'

// jsdom has no canvas, so the resize step is replaced with a fake that
// returns a small "compressed" photo for each file
jest.mock('@/utils/photos', () => {
  const actual = jest.requireActual('@/utils/photos')
  return {
    ...actual,
    compressPhoto: jest.fn(file => {
      if (file.name.startsWith('broken')) return Promise.reject(new Error('decode'))
      return Promise.resolve({ name: file.name, dataUrl: 'data:image/jpeg;base64,AAAA', bytes: 150000, width: 1280, height: 960 })
    })
  }
})

const flushPromises = () => new Promise(resolve => setTimeout(resolve))

const file = (name, type = 'image/jpeg') => ({ name, type })

/**
 * Simulates picking files in one of the file inputs
 */
async function pick (wrapper, files, which = 0) {
  const input = wrapper.findAll('input[type="file"]').at(which)
  Object.defineProperty(input.element, 'files', { value: files, configurable: true })
  await input.trigger('change')
  await flushPromises()
}

describe('PhotoPicker.vue', () => {
  beforeEach(() => jest.clearAllMocks())

  const mountPicker = (props = {}) => mount(PhotoPicker, {
    propsData: { photos: [], maxPhotos: 3, ...props },
    attachTo: document.body
  })

  it('accepts images only, with a separate camera input for phones', () => {
    const inputs = mountPicker().findAll('input[type="file"]')
    expect(inputs.at(0).attributes('accept')).toBe('image/*')
    expect(inputs.at(0).attributes('multiple')).toBeDefined()
    expect(inputs.at(1).attributes('capture')).toBe('environment')
  })

  it('labels each file input', () => {
    const wrapper = mountPicker()
    wrapper.findAll('input[type="file"]').wrappers.forEach(input => {
      expect(wrapper.find(`label[for="${input.attributes('id')}"]`).exists()).toBe(true)
    })
  })

  it('compresses each photo with the configured size and quality', async () => {
    const wrapper = mountPicker({ maxEdge: 1280, quality: 0.7 })
    await pick(wrapper, [file('a.jpg'), file('b.jpg')])

    expect(compressPhoto).toHaveBeenCalledWith(expect.objectContaining({ name: 'a.jpg' }), { maxEdge: 1280, quality: 0.7 })
    expect(wrapper.emitted().input[0][0].map(p => p.name)).toEqual(['a.jpg', 'b.jpg'])
  })

  it('stops at the photo limit and says how many were left out', async () => {
    const wrapper = mountPicker({ maxPhotos: 2 })
    await pick(wrapper, [file('a.jpg'), file('b.jpg'), file('c.jpg')])

    expect(wrapper.emitted().input[0][0].length).toBe(2)
    expect(wrapper.find('[role="alert"]').text()).toContain('up to 2 photos, so 1 was left out')
  })

  it('rejects files that are not photos, and photos that cannot be read, with a friendly message', async () => {
    const wrapper = mountPicker()
    await pick(wrapper, [file('quote.pdf', 'application/pdf'), file('broken.jpg')])

    const message = wrapper.find('[role="alert"]').text()
    expect(message).toContain('"quote.pdf" isn\'t a photo')
    expect(message).toContain('"broken.jpg" couldn\'t be read')
    expect(wrapper.emitted().input).toBeUndefined()
  })

  it('disables adding once the limit is reached', () => {
    const photos = [1, 2, 3].map(i => ({ name: `${i}.jpg`, dataUrl: 'data:,', bytes: 1, width: 1, height: 1 }))
    const wrapper = mountPicker({ photos })
    wrapper.findAll('input[type="file"]').wrappers.forEach(input => {
      expect(input.attributes('disabled')).toBe('disabled')
    })
  })

  it('shows a labelled remove (×) button per photo that removes it', async () => {
    const photos = ['a.jpg', 'b.jpg'].map(name => ({ name, dataUrl: 'data:,', bytes: 1000, width: 1, height: 1 }))
    const wrapper = mountPicker({ photos })
    const buttons = wrapper.findAll('.thumb__remove')

    expect(buttons.length).toBe(2)
    expect(buttons.at(0).attributes('aria-label')).toBe('Remove photo 1 (a.jpg)')
    await buttons.at(0).trigger('click')
    expect(wrapper.emitted().input[0][0].map(p => p.name)).toEqual(['b.jpg'])
  })
})
