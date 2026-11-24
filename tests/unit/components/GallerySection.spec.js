import { mount } from '@vue/test-utils'
import GallerySection from '@/components/GallerySection.vue'
import { makeSite } from '../fixtures/site'

describe('GallerySection.vue', () => {
  const mountGallery = site => mount(GallerySection, { propsData: { site: site || makeSite() } })
  const chips = wrapper => wrapper.findAll('.chip')

  it('makes one filter button per category present, plus All', () => {
    expect(chips(mountGallery()).wrappers.map(c => c.text())).toEqual(['All', 'Flooring', 'Carpentry'])
  })

  it('shows every project at first, with All pressed', () => {
    const wrapper = mountGallery()
    expect(wrapper.findAll('.project').length).toBe(3)
    expect(chips(wrapper).at(0).attributes('aria-pressed')).toBe('true')
  })

  it('filters by category, marks the pressed button and announces the result', async () => {
    const wrapper = mountGallery()
    await chips(wrapper).at(2).trigger('click')

    expect(wrapper.findAll('.project').length).toBe(2)
    expect(chips(wrapper).at(2).attributes('aria-pressed')).toBe('true')
    expect(chips(wrapper).at(0).attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('[aria-live="polite"]').text()).toBe('Showing 2 projects in Carpentry')
  })

  it('uses real buttons, so the filters work from the keyboard', () => {
    chips(mountGallery()).wrappers.forEach(chip => {
      expect(chip.element.tagName).toBe('BUTTON')
      expect(chip.attributes('type')).toBe('button')
    })
  })

  it('hides the filters when there is only one category', () => {
    const site = makeSite({ projects: [makeSite().projects[0]] })
    expect(chips(mountGallery(site)).length).toBe(0)
  })
})
