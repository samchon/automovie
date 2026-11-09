/**
 * Encodes a relative canon path as a stable outline H3 anchor without losing folder identity.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Removing the terminal Markdown extension and encoding folder separators as double hyphens retains classified path identity in an explicit outline anchor; numbered lower-kebab source paths supply the supported alphabet.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The encoder isolates file-to-outline identity spelling used by outline creation and validation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The separator encoding follows the supported settings layout and does not inspect consumer names or file contents.
 * @evidence contracts/development/common.md#meaningful-documentation The comment identifies a stable relative-path-derived H3 anchor and explains why folder identity is kept.
 * @evidence contracts/development/implementation.md#efficient-algorithms The suffix replacement and separator replacement scan the file path with linear string allocation.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This scalar encoder coordinates no reusable requests or effectful work.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned anchor string escapes; no map, descriptor or task is retained.
 */
export function settingsEntryAnchor(file: string): string {
  return file.replace(/\.md$/u, "").replaceAll("/", "--");
}
