import { svg64 } from 'svg64'
import { getCdnBaseUrl, getXiconsVersion } from './configurable'
type IconCdnUrl = string
type IconBase64ImageUrl = string
const cache = new Map<IconCdnUrl, IconBase64ImageUrl>()

export async function getXiconsBase64Image(
  iconName: string,
  iconPackageName: string
): Promise<string> {
  const CDN_BASE = getCdnBaseUrl()
  const ICON_VERSION = getXiconsVersion()

  const [_, subPackageName] = iconPackageName.split('/')

  const iconCdnUrl = `${CDN_BASE}/${subPackageName}@${ICON_VERSION}/${iconName}.svg`

  if (cache.has(iconCdnUrl)) {
    return cache.get(iconCdnUrl)!
  }

  console.log('Request svg -> ' + iconCdnUrl)

  const start = Date.now()

  return new Promise((resolve) => {
    fetch(iconCdnUrl)
      .then((res) => res.text())
      .then((svg) => {
        console.log(
          'Requested ' + iconCdnUrl + ': ' + (Date.now() - start) + 'ms'
        )
        const base64ImageUrl = svg64(svg)
        cache.set(iconCdnUrl, base64ImageUrl)
        resolve(base64ImageUrl)
      })
      .catch(() => {
        // TODO: retry
        console.warn(
          'Request ' + iconCdnUrl + ' failed: ' + (Date.now() - start) + 'ms'
        )
        resolve('')
      })
  })
}
