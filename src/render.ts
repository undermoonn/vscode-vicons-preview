import * as vscode from 'vscode'
import { kebabCase } from 'scule'
import type { Properties as CssProperties } from 'csstype'

export function makeDecorationRender(
  imageUrl: string
): vscode.DecorationInstanceRenderOptions {
  return {
    dark: {
      before: {
        textDecoration: style({
          filter: 'invert(100%)'
        })
      }
    },
    before: {
      contentText: '',
      textDecoration: style({
        width: '1.2em',
        height: '1.4em',
        display: 'inline-block',
        backgroundImage: 'url(' + imageUrl + ')',
        backgroundPosition: 'center 4px',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.2em',
        marginRight: '4px',
        opacity: '0.4'
      })
    }
  }
}

function style(style: CssProperties) {
  return (
    'none;' +
    (Object.keys(style) as Array<keyof CssProperties>).reduce((prev, curr) => {
      return prev + `${kebabCase(curr)}:${style[curr]};`
    }, '')
  )
}
