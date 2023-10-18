import { svg64 } from 'svg64'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

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
    const svg = await readFile(
      resolve(
        __dirname,
        '../node_modules/@sicons',
        subPackageName,
        iconName + '.svg'
      ),
      {
        encoding: 'utf-8'
      }
    )
    const base64ImageUrl = svg64(svg)
    cache.set(key, base64ImageUrl)
    return base64ImageUrl
  } catch (e) {
    console.error(e)
  }
  return ''
}
