import type { IEvidenceInventory } from "@wrtnlabs/evidence";

import type { NarrativeLayer } from "../../NarrativeLayer";

/**
 * Recovers visited directories, including empty ones, from the original glob capture.
 *
 * @evidence contracts/common.md#principled-implementation Selected layer-relative source addresses recover capture roots, and recursive captured dependencies below those roots recover visited directories including empty ones; Windows drive paths compare case-insensitively.
 * @evidence contracts/common.md#clear-and-simple-design Root discovery and directory recovery use only the immutable inventory, keeping topology independent of later filesystem edits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Windows case folding reflects filesystem address semantics; no empty directory is fabricated from a test fixture or silently reopened.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies visited empty directories and the original capture; the return excludes only the layer root itself.
 * @evidence contracts/performance.md#efficient-algorithms For a source addresses, d dependencies and r distinct recovered roots, scanning costs O(a + d*r) path comparisons, followed by O(v log v) sorting of v directories; Sets store O(r + v) strings.
 * @evidence contracts/performance.md#reuse-equivalent-work The native captured addresses/dependencies are reused and roots deduplicated per call; no filesystem reread or global directory cache changes snapshot meaning.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The root and directory Sets are local, and the sorted result belongs to the caller; retained strings scale with distinct captured roots/directories and no handles are opened.
 */
export function collectTopologyDirectories(
  inventory: IEvidenceInventory,
  layer: NarrativeLayer,
): string[] {
  const roots: Set<string> = new Set();
  for (const source of inventory.sources)
    for (const address of source.addresses) {
      const relative: string = address.relative.replaceAll("\\", "/");
      if (address.selected === false || !relative.startsWith(`${layer}/`))
        continue;
      const absolute: string = address.absolute.replaceAll("\\", "/");
      roots.add(`${absolute.slice(0, -relative.length)}${layer}/`);
    }
  const directories: Set<string> = new Set();
  for (const dependency of inventory.dependencies) {
    if (!dependency.recursive) continue;
    const absolute: string = dependency.path.replaceAll("\\", "/");
    for (const root of roots) {
      const windows: boolean = /^[A-Za-z]:\//u.test(root);
      if (
        (windows ? absolute.toLowerCase() : absolute).startsWith(
          windows ? root.toLowerCase() : root,
        )
      )
        directories.add(absolute.slice(root.length));
    }
  }
  return [...directories]
    .filter((directory: string): boolean => directory !== "")
    .sort((left: string, right: string): number =>
      left < right ? -1 : left > right ? 1 : 0,
    );
}
