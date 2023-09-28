import { svg64 } from 'svg64'
import { ofetch } from 'ofetch'
const cache = new Map<string, string>()

export async function getXiconsBase64Image(
  iconName: string,
  iconPackageName: string
): Promise<string> {
  const [_, subPackageName] = iconPackageName.split('/')
  const key = subPackageName + '___' + iconName
  const cachedBase64ImageUrl = cache.get(key)
  if (cachedBase64ImageUrl) {
    return cachedBase64ImageUrl
  }
  try {
    const res = await ofetch(
      `https://cdn.jsdelivr.net/npm/@sicons/${subPackageName}@0.12.0/${iconName}.svg`
    )
    const svg = await res.text()
    const base64ImageUrl = svg64(svg)
    cache.set(key, base64ImageUrl)
    return base64ImageUrl
  } catch (e) {
    console.error(e)
  }
  return ''
}
