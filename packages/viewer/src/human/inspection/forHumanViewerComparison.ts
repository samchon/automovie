import type { HumanViewerAddress } from "./HumanViewerAddress.js";

/**
 * The address a comparison draws for one of its two documents. A comparison sets two renders side by side and their difference, so neither carries a reference photograph or its landmarks: a document with a photograph and one without would otherwise produce captures of different widths that cannot be differenced. The photograph comparison is `ref` on one document.
 *
 * @evidence contracts/common.md#principled-implementation The comparison address substitutes only the selected document and disables reference/photo markers so paired render widths share the same display mode.
 * @evidence contracts/common.md#clear-and-simple-design One copied address preserves camera, pass and other selected state while explicit fields define comparison-specific behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A photograph-bearing document cannot silently change one paired image's width and be passed off as a comparable numerical render.
 * @evidence contracts/common.md#meaningful-documentation The comment explains side-by-side/difference composition and directs photograph comparison to the single-document reference path.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Copying a fixed address record chooses no rendering or image-difference algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The adapter derives one address per requested comparison document and caches no earlier display selection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned shallow copy shares borrowed address arrays; no photograph, bitmap or renderer resource is acquired.
 */
export function forHumanViewerComparison(
  address: HumanViewerAddress,
  doc: string,
): HumanViewerAddress {
  return { ...address, doc, ref: null, landmarks: false };
}
