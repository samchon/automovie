import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";

/**
 * One material overlay vertex, retaining both the actual skin attachment and
 * the original grid's affine coordinates. The latter interpolate grid-owned
 * values; they are not a new anatomical or personal authoring control.
 *
 *
 * @evidence contracts/common.md#principled-implementation Original construction identity retains both actual skin barycentrics and original-grid interpolation coordinates.
 * @evidence contracts/common.md#clear-and-simple-design The sheet assembler owns exact overlay construction and rounds material readers only at publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Grid weights are internal correspondence rather than a new personal anatomical control.
 * @evidence contracts/common.md#meaningful-documentation The prose gives provenance, rounded dimensionless UV, host seat and original grid parent/weights.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceConformingSheetVertex is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceConformingSheetVertex declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceConformingSheetVertex itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceConformingSheetVertex {
  /** Original vertex or original edge-pair identity used for shared incidence. */
  provenance: string;

  /** Material UV, rounded only after exact intersection construction. */
  materialPoint: [number, number];

  /** Actual source skin triangle and its attachment weights. */
  seat: IHumanFaceSkinSeat;

  /** Original canonical grid triangle containing this overlay vertex. */
  gridCorners: [number, number, number];

  /** Affine coordinates in that original grid triangle. */
  gridWeights: [number, number, number];
}
