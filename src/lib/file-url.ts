const FILES_MARKER = '/v1/files/'

const decodeSafe = (segment: string) => {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/**
 * Turn a stored file key into a URL the browser can open.
 *
 * Uploads return a bare key (e.g. "uuid___po.pdf"), while API responses
 * normally return an absolute URL. Without this, a freshly uploaded file
 * resolves relative to the current page, e.g. /purchases/uuid___po.pdf.
 */
export function getFileUrl(value?: string | null): string {
  if (!value) return ''
  if (/^(blob:|data:)/i.test(value)) return value

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')

  if (/^https?:\/\//i.test(value)) {
    // API responses build absolute URLs from server APP_URL. If that config
    // points at the frontend origin, re-anchor the file path to the API origin
    // the browser actually talks to.
    const markerIndex = value.indexOf(FILES_MARKER)
    if (markerIndex === -1) return value

    const fileKey = value.slice(markerIndex + FILES_MARKER.length)
    return apiUrl ? `${apiUrl}/files/${fileKey}` : `/v1/files/${fileKey}`
  }

  const rawPath = value.startsWith('/v1/')
    ? value.slice('/v1'.length)
    : value.startsWith('/files/')
      ? value
      : `/files/${value.replace(/^\/+/, '')}`
  // Encode each segment so names with "#", "?" or spaces stay part of the file name
  const relativePath = rawPath
    .split('/')
    .map((segment) => encodeURIComponent(decodeSafe(segment)))
    .join('/')

  return apiUrl ? `${apiUrl}${relativePath}` : `/v1${relativePath}`
}
