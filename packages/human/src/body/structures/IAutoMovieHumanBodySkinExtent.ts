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
