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
 * @evidence contracts/common.md#principled-implementation Dominant bone weights select a skin region whose extrema are projected along or across a horizontal landmark axis.
 * @evidence contracts/common.md#clear-and-simple-design The instrument names region bones independently from its landmark direction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extrema are found on the current shaped skin, without freezing witness vertices from one reference body.
 * @evidence contracts/common.md#meaningful-documentation The prose specifies horizontal projection, dominant-weight membership and current-shape extremal reading.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The skin caliper extent rules definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The skin caliper extent rules type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The skin caliper extent rules declaration does not acquire or retain runtime resources.
 *
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
