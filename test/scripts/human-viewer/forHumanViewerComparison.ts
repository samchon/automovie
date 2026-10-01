import type { HumanViewerAddress } from "./HumanViewerAddress";

/**
 * The address a comparison draws for one of its two documents. A comparison
 * sets two renders side by side and their difference, so neither carries a
 * reference photograph or its landmarks: a document with a photograph and one
 * without would otherwise produce captures of different widths that cannot be
 * differenced. The photograph comparison is `ref` on one document.
 *
 * @evidence contracts/common.md#principled-implementation Differencing needs equal dimensions, which only photograph-free captures guarantee.
 * @evidence contracts/common.md#clear-and-simple-design One function owns what a comparison draws.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Changes only display layers and never a document.
 * @evidence contracts/common.md#meaningful-documentation States why photograph layers are removed.
 */
export function forHumanViewerComparison(
  address: HumanViewerAddress,
  doc: string,
): HumanViewerAddress {
  return { ...address, doc, ref: null, landmarks: false };
}
