import { workspace } from 'vscode'

export function getCdnBaseUrl() {
  return workspace.getConfiguration().get<string>('xicons-preview.xicons-cdn')
}

export function getXiconsVersion() {
  return workspace
    .getConfiguration()
    .get<string>('xicons-preview.xicons-version')
}
