import { portraitFacialOvalVertices } from "./portraitFacialOvalVertices";

/**
 * Read the lowest point on the facial-oval boundary. Both trait
 * interpretation and cranial continuation use this same attachment datum;
 * a singled-out chin landmark cannot substitute for an asymmetric lower oval.
 *
 * @evidence contracts/common.md#principled-implementation The minimum finite resident Y over the actual facial-oval identity list is the common cranial/neck attachment datum.
 * @evidence contracts/common.md#clear-and-simple-design Trait interpretation and cranial continuation share one boundary-height reader rather than selecting different chin landmarks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable or non-finite resident heights refuse, and an asymmetric oval is not reduced to one presumed chin ID.
 * @evidence contracts/common.md#meaningful-documentation The prose explains the lowest-boundary purpose and why one singled-out landmark cannot substitute.
 * @evidence contracts/performance.md#efficient-algorithms Exactly 36 boundary heights are gathered and admitted; cost is fixed with respect to the complete host mesh.
 * @evidence contracts/performance.md#reuse-equivalent-work The reader uses the canonical portraitFacialOvalVertices identity list shared with continuation and computes each requested current-host datum anew.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The height array is call-local and only one number escapes; no host positions or resource are retained.
 */
export function portraitCranialChinHeight(
  positions: readonly (readonly number[])[],
): number {
  const heights: number[] = portraitFacialOvalVertices.map((id: number): number  => positions[id]?.[1]);
  if (!heights.every(Number.isFinite))
    throw new Error("The cranial boundary requires finite resident heights.");
  return Math.min(...heights);
}
