import type { IAutoMovieVector3 } from "@automovie/interface";

/** One legacy vertex or native material seat read on actual geometry.
 *
 * @evidence contracts/common.md#principled-implementation readHumanFaceLipMarginPoints verifies persisted exact correspondence then exposes the canonical represented interpolation with native supports and stable source identity.
 * @evidence contracts/common.md#clear-and-simple-design Point, support coefficients and exact-anchor status travel together for closure/contact consumers without reseating on a different performed sheet.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reader neither normalizes represented weights nor invents anchors; nativeVertex is null for a genuine interior material seat and source identity must match its persisted exact support.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish represented point, legacy one-vertex support, unchanged coefficients and source-native anchor identity; physical coordinates use basis metres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result implements no interpolation; the margin reader and canonical engine arithmetic own it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no requests; consuming stages share the verified native/material correspondence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; returned point/support arrays belong to the margin population owner.
 *
 * @author Samchon
 */
export interface IHumanFaceLipMarginPoint {
  /** Actual basis-metre point from the canonical represented interpolation. */
  point: IAutoMovieVector3;

  /** Native support vertices; legacy support has one vertex and weight one. */
  vertices: readonly number[];

  /** Matching coefficients, never normalized by the reader. */
  weights: readonly number[];

  /** Stable source material identity for the same physical join. */
  identity: string;

  /** Exact source vertex only when this point is that original anchor. */
  nativeVertex: number | null;
}
