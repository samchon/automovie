/** Encodes a relative canon path as a stable outline H3 anchor without losing folder identity. */
export function settingsEntryAnchor(file: string): string {
  return file.replace(/\.md$/u, "").replaceAll("/", "--");
}
