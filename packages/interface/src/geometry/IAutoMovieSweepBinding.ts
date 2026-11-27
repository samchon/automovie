import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * How a sweep rides a skeleton: the bone each spine point follows and the bone
 * or joint each station follows, for `poseSweep`.
 *
 * A station on one bone keeps its orientation in that bone's frame, as an
 * intermediate key section follows its link. A station on two bones sits at the
 * joint between them and takes the orientation halfway between the two bones'
 * motions, as a key section at a joint turns with the relative orientation of
 * its two links (Hyun et al. 2005, The Visual Computer 21(8-10):542-550,
 * Section 4.1); halfway is this engine's choice of that function.
 */
export interface IAutoMovieSweepBinding {
  /** Bone each spine point follows, aligned with `spine.points`. */
  points: AutoMovieHumanoidBone[];

  /**
   * Bones each station follows, aligned with `stations`: one bone for a station
   * on a link, the parent and child bones for a station at their joint.
   */
  stations: Array<
    [AutoMovieHumanoidBone] | [AutoMovieHumanoidBone, AutoMovieHumanoidBone]
  >;
}
