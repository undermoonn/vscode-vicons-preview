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
        width: '1rem',
        height: '1rem',
        display: 'inline-block',
        backgroundImage: 'url(' + imageUrl + ')',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1rem',
        marginRight: '0.4rem',
        opacity: '0.4',
        verticalAlign: 'text-bottom'
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
