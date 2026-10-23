import path from "node:path";

import { withinProductionDirectory } from "./withinProductionDirectory";

/**
 * Tests whether an address belongs to this production's shared promoted body tree.
 *
 * @evidence contracts/common.md#principled-implementation The production body directory is passed to the same physical/logical containment predicate used by authored ownership, so shared body paths are exempted only within this production.
 * @evidence contracts/common.md#clear-and-simple-design The helper names the one shared-tree exception used by foreign-boundary rejection; it does not assign a body pass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The exemption is rooted at the supplied production directory and never accepts an arbitrary foreign body tree.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies this production and its promoted body tree; the boolean indicates membership without claiming a pass.
 * @evidence contracts/performance.md#efficient-algorithms One path construction and two canonical containment checks cost O(p) in path length with constant-count transient strings.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller-supplied canonicalizer is reused, keeping body classification tied to its captured aliases rather than observing new filesystem state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a body-directory string and comparison temporaries exist for the duration of the call; no retained table or handle is owned.
 */
export function sharedBody(
  root: string,
  filename: string,
  canonical: (filename: string, logicalRoot?: string) => string,
): boolean {
  return withinProductionDirectory(
    root,
    filename,
    path.resolve(root, "docs", "body"),
    canonical,
  );
}
