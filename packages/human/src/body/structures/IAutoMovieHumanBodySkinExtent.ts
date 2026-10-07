import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * A caliper-style extent of one skin region, read between its extreme points
 * on the shaped skin.
 *
 * The region is every skin vertex whose largest skin weight belongs to one of
 * `bones`, the same dominant-weight rule the body segmenter uses. The axis is
 * the `from`→`to` landmark direction projected onto the horizontal plane; the
 * reading is the region's extent along that axis, or across it horizontally
 * when `across` is true. The extreme points are found on each shape's final
 * skin rather than fixed to vertices chosen on one shape, so a shape that
 * moves the heel's or a toe's farthest point is followed.
 *
 * @evidence contracts/common.md#principled-implementation Extreme points are searched on the shaped skin, so the instrument follows each shape instead of fixed vertices.
 * @evidence contracts/common.md#clear-and-simple-design A region by dominant bone, one axis and one direction flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex index is stored; a missing landmark or empty region answers null in the reader.
 * @evidence contracts/common.md#meaningful-documentation States the region, axis, direction and why extremes are searched.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The dominant-weight region is a rig attachment, not an anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions The reading is metres on the basis frame; horizontal means perpendicular to +Y.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It reads the builder's skin and builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The measured channel's consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each rule in HUMAN_BODY_MEASUREMENTS states the survey definition it approximates.
 * @evidenceExclude contracts/anatomy.md#permitted-range It reads and bounds no authored value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is an instrument definition, not an authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinExtent {
  /** A region extent between extreme skin points. */
  kind: "extent";

  /** Landmark id where the axis starts. */
  from: string;

  /** Landmark id where the axis ends. */
  to: string;

  /** Rig bones whose dominantly weighted skin vertices form the region. */
  bones: AutoMovieHumanoidBone[];

  /** Read across the horizontal axis instead of along it. */
  across: boolean;
}
