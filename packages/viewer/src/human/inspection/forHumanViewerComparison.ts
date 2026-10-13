import type { HumanViewerAddress } from "./HumanViewerAddress.js";

/**
 * The address a comparison draws for one of its two documents. A comparison
 * sets two renders side by side and their difference, so neither carries a
 * reference photograph or its landmarks: a document with a photograph and one
 * without would otherwise produce captures of different widths that cannot be
 * differenced. The photograph comparison is `ref` on one document.
 */
export function forHumanViewerComparison(
  address: HumanViewerAddress,
  doc: string,
): HumanViewerAddress {
  return { ...address, doc, ref: null, landmarks: false };
}
