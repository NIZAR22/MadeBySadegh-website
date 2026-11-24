import { fitWithin, requestBytes, utf8Bytes, isImageFile, formatBytes } from '@/utils/photos'

describe('fitWithin', () => {
  it('scales the longest side down to the limit, keeping the shape', () => {
    expect(fitWithin(4032, 3024, 1280)).toEqual({ width: 1280, height: 960 })
    expect(fitWithin(3024, 4032, 1280)).toEqual({ width: 960, height: 1280 })
  })

  it('never scales a small photo up', () => {
    expect(fitWithin(800, 600, 1280)).toEqual({ width: 800, height: 600 })
  })
})

describe('request size', () => {
  it('counts UTF-8 bytes, not characters', () => {
    expect(utf8Bytes('abc')).toBe(3)
    expect(utf8Bytes('—')).toBe(3)
  })

  it('measures the whole JSON body, photos included', () => {
    const photo = 'data:image/jpeg;base64,' + 'A'.repeat(1000)
    const body = { service_id: 's', template_params: { photo_1: photo } }
    expect(requestBytes(body)).toBe(JSON.stringify(body).length)
    expect(requestBytes(body)).toBeGreaterThan(1000)
  })
})

describe('isImageFile', () => {
  it('accepts images by type, and iPhone HEIC files reported without a type', () => {
    expect(isImageFile({ type: 'image/jpeg', name: 'a.jpg' })).toBe(true)
    expect(isImageFile({ type: '', name: 'IMG_0001.HEIC' })).toBe(true)
  })

  it('rejects other files', () => {
    expect(isImageFile({ type: 'application/pdf', name: 'quote.pdf' })).toBe(false)
    expect(isImageFile(null)).toBe(false)
  })
})

describe('formatBytes', () => {
  it('shows KB and MB', () => {
    expect(formatBytes(320000)).toBe('320 KB')
    expect(formatBytes(1460000)).toBe('1.5 MB')
  })
})
