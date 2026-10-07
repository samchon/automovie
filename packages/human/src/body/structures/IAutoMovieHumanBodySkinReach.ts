import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * How far a skin region reaches past a named skin point along an axis, as a
 * caliper read with its fixed blade on a drawn landmark and its beam along a
 * limb reads the farthest point of the limb's end.
 *
 * The axis runs from the `from` joint landmark to the `to` joint landmark.
 * The region is every skin vertex whose largest skin weight belongs to one of
 * `bones` (`humanBodyDominantVertices`). The reading is the largest
 * projection of a region vertex past the `origin` skin point along the axis,
 * so the extreme is found on each shape's final skin.
 *
 * @evidence contracts/common.md#principled-implementation The fixed end is a registered landmark and the free end an extreme found on each shape.
 * @evidence contracts/common.md#clear-and-simple-design Five fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing landmark or empty region answers null.
 * @evidence contracts/common.md#meaningful-documentation States the axis, the region and the reading.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The dominant-weight region is a rig attachment, not an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions A metre projection in the basis frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule using it owns the survey definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinReach {
  /** A region's reach past a skin point along a joint axis. */
  kind: "skin-reach";

  /** Joint landmark id where the axis starts. */
  from: string;

  /** Joint landmark id where the axis ends. */
  to: string;

  /** Skin landmark name the reach is read from. */
  origin: string;

  /** Rig bones whose dominantly weighted skin vertices form the region. */
  bones: AutoMovieHumanoidBone[];
}
