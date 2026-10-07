import type { IHumanFaceSkinSeat } from "../../skin/IHumanFaceSkinSeat";

/**
 * One material overlay vertex, retaining both the actual skin attachment and
 * the original grid's affine coordinates. The latter interpolate grid-owned
 * values; they are not a new anatomical or personal authoring control.
 *
 * @evidence contracts/common.md#principled-implementation Separate source and grid barycentric witnesses retain the two piecewise-affine maps at a shared cut.
 * @evidence contracts/common.md#clear-and-simple-design One transient vertex carries attachment and provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Provenance names original vertices or intersecting original edges rather than proximity aliases.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the source attachment from interpolation of existing grid-owned values.
 * @evidence contracts/modeling.md#spatial-conventions Material coordinates and weights are dimensionless; the skin reader alone supplies head-frame metres.
 * @evidence contracts/modeling.md#shared-boundaries The seat addresses the existing skin rather than a second spatial surface.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Transports an attachment rather than defining an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The overlay producer owns population.
 * @evidenceExclude contracts/modeling.md#rendered-observation The attached tissue owner observes the final shell.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries topology rather than a measured anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal authoring input.
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
