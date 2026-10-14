import { DOCS } from "./DOCS";

/**
 * Where the shared contracts actually live.
 *
 * Graph callers supply resident discovery, naturalness, upstream, obligation, principle and selected-language contracts under the project's docs tree. Current experimental callers own those documents; the current blank scaffold ships no docs or language pack, and this function neither copies nor materializes one. Inventory admission separately checks the required paths, anchors and routing metadata.
 *
 * @evidence contracts/common.md#principled-implementation Required resident contract routes resolve under the caller-owned project's docs directory.
 * @evidence contracts/common.md#clear-and-simple-design The graph caller owns the physical inventory; this function supplies its relative root without reaching into installed package files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The location argument currently does not affect this relative root; inventory admission checks paths, anchors and metadata rather than byte-for-byte template equality.
 * @evidence contracts/common.md#meaningful-documentation The returned root is relative and callers resolve it against their project location.
 * @evidence contracts/performance.md#efficient-algorithms Returning the fixed directory string takes constant work and performs no I/O.
 * @evidence contracts/performance.md#reuse-equivalent-work All factory routes reuse the same docs address; no per-location root cache is required.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the string escapes and no installed-package handle or project state is retained.
 */
export function sharedDocsRoot(_location: string): string {
  return DOCS;
}
