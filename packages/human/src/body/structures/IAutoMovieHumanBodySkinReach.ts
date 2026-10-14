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
 * @evidence contracts/common.md#principled-implementation The maximum projection beyond a registered skin origin measures a dominantly weighted region along a landmark axis.
 * @evidence contracts/common.md#clear-and-simple-design The rule keeps the origin, axis landmarks and region membership explicit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The extremum is recomputed on the shaped surface instead of storing a witness from another shape.
 * @evidence contracts/common.md#meaningful-documentation Members identify skin versus joint landmarks and the dominant-weight region.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The skin axial reach rules definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The skin axial reach rules type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The skin axial reach rules declaration does not acquire or retain runtime resources.
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
