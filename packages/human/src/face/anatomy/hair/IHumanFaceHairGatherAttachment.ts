import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Current scalp point and source triangle consumed by the gather graph. The graph needs no neutral barycentric weights after attachment resolution.
 *
 * @evidence contracts/common.md#principled-implementation A current scalp point paired with its original source triangle gives graph compilation the resolved tie without neutral chart coordinates.
 * @evidence contracts/common.md#clear-and-simple-design The smaller base record omits barycentric weights because the current gather graph does not need transport history after resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original source identity is explicit rather than a nearest-face guess made independently by the graph consumer.
 * @evidence contracts/common.md#meaningful-documentation Members identify head-frame metre position and original source-triangle ordinal consumed by the graph.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This attachment view selects no graph propagation or surface-query algorithm; it is resolved input to field compilation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current point is tied to its source correspondence, and this base view declares no equivalence with another pose's attachment.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only one position and triangle number are borrowed; graph lifetime belongs to the field compiler rather than this view.
 *
 * @author Samchon
 */
export interface IHumanFaceHairGatherAttachment {
  /** Current scalp attachment in head-frame metres. */
  point: IAutoMovieVector3;

  /** Original source triangle ordinal. */
  triangle: number;
}
