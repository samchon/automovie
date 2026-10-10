import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";

/**
 * One material overlay vertex, retaining both the actual skin attachment and
 * the original grid's affine coordinates. The latter interpolate grid-owned
 * values; they are not a new anatomical or personal authoring control.
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
