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
