import { DOCS } from "./DOCS";

/**
 * Where the shared contracts actually live.
 *
 * `@automovie/template` ships discovery, naturalness, upstream, obligation, and principle contracts under their physical `family/domain/file` addresses inside the generated project. The scaffold copies the complete inventory verbatim, so graph lint and a standalone generated consumer both resolve the same project-owned contract root without reaching back into an installed package. The inventory remains pinned here by domain, filename, and anchor; a missing file or divergent address inventory is a concrete graph failure.
 *
 * @evidence contracts/common.md#principled-implementation Bundled contract routes resolve under the generated project's docs directory.
 * @evidence contracts/common.md#clear-and-simple-design The generated scaffold owns the physical inventory, so installed package paths are not used as target roots.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The location argument currently does not affect this relative root; inventory admission checks paths, anchors and metadata rather than byte-for-byte template equality.
 * @evidence contracts/common.md#meaningful-documentation The returned root is relative and callers resolve it against their project location.
 * @evidence contracts/performance.md#efficient-algorithms Returning the fixed directory string takes constant work and performs no I/O.
 * @evidence contracts/performance.md#reuse-equivalent-work All factory routes reuse the same docs address; no per-location root cache is required.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the string escapes and no installed-package handle or project state is retained.
 */
export function sharedDocsRoot(_location: string): string {
  return DOCS;
}
