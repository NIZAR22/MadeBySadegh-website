/**
 * Photo handling for the quote form's 'emailjs' photo mode.
 *
 * Phone photos are 3-8 MB each, which would blow through EmailJS's request
 * limit and crawl on mobile data. Each photo is therefore redrawn on a canvas
 * at a smaller size and re-encoded as JPEG before it's attached. Re-encoding
 * also drops the EXIF metadata, including the GPS location many phones
 * embed, so a customer's home location isn't emailed around by accident.
 */

/**
 * Scales width/height down so the longest side is at most maxEdge,
 * keeping the aspect ratio. Never scales up.
 * @param {number} width
 * @param {number} height
 * @param {number} maxEdge
 * @returns {{ width: number, height: number }}
 */
export function fitWithin (width, height, maxEdge) {
  const longest = Math.max(width, height)
  if (!longest || longest <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) }
  }
  const scale = maxEdge / longest
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/**
 * Size in bytes of a string once sent as UTF-8. Base64 photo data is plain
 * ASCII (1 byte per character), but names and messages may not be.
 * @param {string} text
 * @returns {number}
 */
export function utf8Bytes (text) {
  const value = String(text)
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length
  }
  // Fallback for old browsers: each %XX escape is one byte
  return unescape(encodeURIComponent(value)).length
}

/**
 * Approximate size of the request EmailJS receives: a JSON body with the
 * IDs and all template parameters (photos included as Base64 data URLs).
 * Used to refuse an oversized send with a friendly message instead of
 * letting EmailJS reject it.
 * @param {object} body - { service_id, template_id, user_id, template_params }
 * @returns {number}
 */
export function requestBytes (body) {
  return utf8Bytes(JSON.stringify(body))
}

/**
 * Whether a file is one the browser should be able to decode as a photo.
 * iPhones may report HEIC photos with an empty type, so the extension is
 * checked too.
 * @param {File} file
 * @returns {boolean}
 */
export function isImageFile (file) {
  if (!file) return false
  if (file.type && file.type.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name || '')
}

/**
 * Decodes a file into something a canvas can draw. createImageBitmap with
 * imageOrientation 'from-image' rotates photos the way the camera held them;
 * the <img> fallback gets the same rotation from the browser's default
 * CSS image-orientation.
 * @param {File} file
 * @returns {Promise<{ source: CanvasImageSource, width: number, height: number, release: Function }>}
 */
function decodeImage (file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file, { imageOrientation: 'from-image' })
      .then(bitmap => ({
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close && bitmap.close()
      }))
      .catch(() => decodeWithImg(file))
  }
  return decodeWithImg(file)
}

/**
 * Fallback decoder using an <img> element and an object URL
 * @param {File} file
 * @returns {Promise}
 */
function decodeWithImg (file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url)
    })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode'))
    }
    img.src = url
  })
}

/**
 * Resizes and re-encodes a photo as JPEG.
 * @param {File} file
 * @param {{ maxEdge: number, quality: number }} options
 * @returns {Promise<{ name: string, dataUrl: string, bytes: number, width: number, height: number }>}
 */
export async function compressPhoto (file, { maxEdge, quality }) {
  const image = await decodeImage(file)
  try {
    const size = fitWithin(image.width, image.height, maxEdge)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    // White first: transparent PNG areas would otherwise turn black in JPEG
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, size.width, size.height)
    context.drawImage(image.source, 0, 0, size.width, size.height)
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    return {
      name: (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg',
      dataUrl,
      bytes: dataUrl.length,
      width: size.width,
      height: size.height
    }
  } finally {
    image.release()
  }
}

/**
 * Human-readable size, e.g. 1.4 MB or 320 KB
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes (bytes) {
  if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1000))} KB`
}
