import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * How a sweep rides a skeleton: the bone each spine point follows and the
 * bone or joint each station follows, for `poseAutoMovieSweep`.
 *
 * A station on one bone keeps its orientation in that bone's frame, as an
 * intermediate key section follows its link. A station on two bones sits at
 * the joint between them and takes the orientation halfway between the two
 * bones' motions, as a key section at a joint turns with the relative
 * orientation of its two links (Hyun et al. 2005, The Visual Computer
 * 21(8-10):542-550, Section 4.1); halfway is this engine's choice of that function.
 *
 * @evidence contracts/common.md#principled-implementation Key sections either ride a link rigidly or sit at a joint and turn with both links, the two binding kinds of sweep-based deformation.
 * @evidence contracts/common.md#clear-and-simple-design Bone names aligned with the sweep's own points and stations; no weights, because the sweep's interpolation spreads each motion between stations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Misaligned bindings are refused by the poser, not padded.
 * @evidence contracts/common.md#meaningful-documentation States what each binding kind does, the halfway choice and its basis.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record owned by its caller.
 */
export interface IAutoMovieSweepBinding {
  /** Bone each spine point follows, aligned with `spine.points`. */
  points: AutoMovieHumanoidBone[];

  /** Bones each station follows, aligned with `stations`: one bone for a station on a link, the parent and child bones for a station at their joint. */
  stations: Array<
    [AutoMovieHumanoidBone] | [AutoMovieHumanoidBone, AutoMovieHumanoidBone]
  >;
}
