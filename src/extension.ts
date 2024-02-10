import * as vscode from 'vscode'
import { debounce } from 'perfect-debounce'

import { getXiconsBase64Image } from './icon'
import { makeDecorationRender } from './render'

type CacheKey = string
type DecorationWithIconInfos = {
  iconName: string
  iconPackageName: string
  getDecoration: (imageUrl: string) => vscode.DecorationOptions
}
type DecorationReadyToCache = {
  editor: vscode.TextEditor
  decorations: DecorationWithIconInfos[]
}

const debounceScanToSetDecorations = debounce(scanToSetDecorations, 300)
const decorationSetCacheMap = new WeakMap<
  vscode.TextEditor,
  Map<CacheKey, vscode.TextEditorDecorationType>
>()

function makeCacheKey(
  decoration: vscode.DecorationOptions,
  iconName: string
): CacheKey {
  return JSON.stringify(decoration.range) + '---' + iconName
}

function initVisibleTextEditors() {
  vscode.window.visibleTextEditors
    .map((p) => p.document)
    .filter((p) => p != null)
    .forEach((doc) => debounceScanToSetDecorations(doc))
}

// --------------------

export function activate(context: vscode.ExtensionContext) {
  initVisibleTextEditors()

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      debounceScanToSetDecorations(e.document)
    })
  )
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((e) => {
      if (e) {
        debounceScanToSetDecorations(e.document)
      }
    })
  )
}

export function deactivate() {}

function findEditorsForDocument(document: vscode.TextDocument) {
  return vscode.window.visibleTextEditors.filter(
    (p) => p.document.uri === document.uri
  )
}

function matchToGenergateDecorations(
  editor: vscode.TextEditor,
  matchedString: string,
  matchedIndex: number,
  iconPackageName: string
): DecorationReadyToCache {
  const iconNames = matchedString.replace(/{|}|\s+/g, '').split(',')
  const decroations: DecorationWithIconInfos[] = []

  for (let i = 0; i < iconNames.length; i++) {
    const iconName = iconNames[i].trim()
    if (!iconName) {
      continue
    }
    const nameMatch = new RegExp(`${iconName}[^A-Za-z]`).exec(matchedString)
    const nameMathIndex = nameMatch?.index || -1
    if (nameMathIndex === -1) {
      continue
    }
    const startPos = matchedIndex + nameMathIndex
    const endPos = startPos + iconName.length
    const range = new vscode.Range(
      editor.document.positionAt(startPos),
      editor.document.positionAt(endPos)
    )
    decroations.push({
      iconName,
      iconPackageName,
      getDecoration(imageUrl) {
        return {
          range,
          renderOptions: makeDecorationRender(imageUrl)
        }
      }
    })
  }

  return {
    editor,
    decorations: decroations
  }
}

function scanToSetDecorations(document: vscode.TextDocument) {
  console.time('Scan code to async set icons preview')
  const queue: Array<DecorationReadyToCache> = []

  findEditorsForDocument(document).forEach((editor) => {
    let sourceCode = editor.document.getText()
    let shouldLoopToMatch = true
    let index = 0

    while (shouldLoopToMatch) {
      // import { AddOutline, Add } from '@vicons/ionicons5'
      // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      const viconImportMatched =
        /import((?!import)[\s\S])+(v|r|s|v2)icons[\w\/]+('|")/.exec(sourceCode)

      // import { AddOutline, Add } from '@vicons/ionicons5'
      //                                  ^^^^^^^^^^^^^^^^^
      const iconPackageName = /@(v|r|s|v2)icons\/\w+/.exec(sourceCode)?.[0]

      // import { AddOutline, Add } from '@vicons/ionicons5'
      //        ^^^^^^^^^^^^^^^^^^^
      const viconNamesMatched = /\{((\s+)?\w+,?(\s+)?)+\}/.exec(
        viconImportMatched?.[0] || ''
      )

      if (viconImportMatched && viconNamesMatched && iconPackageName) {
        queue.push(
          matchToGenergateDecorations(
            editor,
            viconNamesMatched[0],
            index + viconImportMatched.index + viconNamesMatched.index,
            iconPackageName
          )
        )
      }

      if (viconImportMatched) {
        sourceCode = sourceCode.slice(
          viconImportMatched.index + viconImportMatched[0].length
        )
        index = index + viconImportMatched.index + viconImportMatched[0].length
      } else {
        shouldLoopToMatch = false
      }
    }
  })

  function mergeEditorInQueue(): DecorationReadyToCache[] {
    const map = new Map<
      DecorationReadyToCache['editor'],
      DecorationReadyToCache['decorations']
    >()
    queue.forEach((item) => {
      const decorations = [...(map.get(item.editor) || []), ...item.decorations]
      map.set(item.editor, decorations)
    })
    return Array.from(map).map(([editor, decorations]) => ({
      editor,
      decorations
    }))
  }

  mergeEditorInQueue().forEach((readyToCache) => {
    const { editor, decorations: decroations } = readyToCache
    const newCacheMap = new Map<CacheKey, vscode.TextEditorDecorationType>()
    const oldCacheMap = decorationSetCacheMap.get(editor)
    decroations.forEach((item) => {
      const cacheKey = makeCacheKey(item.getDecoration('fake'), item.iconName)
      const decorationType = oldCacheMap?.get(cacheKey)
      if (decorationType) {
        // set cache to new one, then do nothing
        newCacheMap.set(cacheKey, decorationType)
      } else {
        // make a new decoration, then cache it
        const newDecorationType = vscode.window.createTextEditorDecorationType(
          {}
        )
        newCacheMap.set(cacheKey, newDecorationType)

        // async set decoration
        getXiconsBase64Image(item.iconName, item.iconPackageName).then(
          (imageUrl) => {
            if (imageUrl) {
              editor.setDecorations(newDecorationType, [
                item.getDecoration(imageUrl)
              ])
            }
          }
        )
      }
    })

    // clean up old caches
    oldCacheMap?.forEach((value, key) => {
      if (!newCacheMap.get(key)) {
        editor.setDecorations(value, [])
      }
    })
    oldCacheMap?.clear()
    decorationSetCacheMap.set(editor, newCacheMap)
  })

  console.timeEnd('Scan code to async set icons preview')
}
