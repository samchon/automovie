import { AutoMovieHumanoidBone } from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../../kinematics/IAutoMovieResolvedBone";

/**
 * Each bone's rigid motion from rest to the current pose in arrays, from
 * `bufferAutoMovieBones`, refreshed per pose without allocation.
 *
 * Bone `b` carries a point `p` to `P_b + Q_b R_b^-1 (p - O_b)` and a direction
 * by `Q_b R_b^-1` alone, the transform `createAutoMovieBoneMotion` gives.
 * Before the first `update`, and after `reset`, every motion is the identity,
 * applied as an exact copy.
 *
 * @evidence contracts/common.md#principled-implementation The per-joint rigid transform of skinning, held as one quaternion and two origins per bone.
 * @evidence contracts/common.md#clear-and-simple-design Bones are addressed by their index in the rest list, resolved once by name when a rig compiles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `update` refuses a posed list whose bones differ from the rest list rather than matching them by search.
 * @evidence contracts/common.md#meaningful-documentation States the transform, the identity state and the addressing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; costs are on `bufferAutoMovieBones`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record; it is the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record whose arrays its producer sizes.
 * @author Samchon
 */
export interface IAutoMovieBoneBuffer {
  /** The rest bones' names, in the order `update` expects the posed list. */
  bones: readonly AutoMovieHumanoidBone[];

  /**
   * Index of a bone in the rest list.
   *
   * @param bone Bone name
   * @returns Its index
   * @throws Error when the rest list lacks the bone
   *
   * @evidence contracts/common.md#principled-implementation Bone names resolve once to indices of the rest list.
   * @evidence contracts/common.md#clear-and-simple-design One lookup.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing bone is refused.
   * @evidence contracts/common.md#meaningful-documentation States the return and refusal.
   * @evidence contracts/performance.md#efficient-algorithms One map read.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `bufferAutoMovieBones`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `bufferAutoMovieBones`.
   */
  index(bone: AutoMovieHumanoidBone): number;

  /**
   * Take each bone's motion from rest to `posed`.
   *
   * @param posed The same bones as the rest list, in the same order
   * @throws Error when the lists differ in length or in a bone
   *
   * @evidence contracts/common.md#principled-implementation Each bone's rigid motion from rest to pose.
   * @evidence contracts/common.md#clear-and-simple-design One call per pose.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A posed list out of step with the rest list is refused.
   * @evidence contracts/common.md#meaningful-documentation States the expected order.
   * @evidence contracts/performance.md#efficient-algorithms O(B) for B bones, no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `bufferAutoMovieBones`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `bufferAutoMovieBones`.
   */
  update(posed: readonly IAutoMovieResolvedBone[]): void;

  /**
   * Return every motion to the identity, the rest pose.
   *
   * @evidence contracts/common.md#principled-implementation The identity motion of the rest pose.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Points are then copied exactly, not transformed.
   * @evidence contracts/common.md#meaningful-documentation States the effect.
   * @evidence contracts/performance.md#efficient-algorithms O(B).
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `bufferAutoMovieBones`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `bufferAutoMovieBones`.
   */
  reset(): void;

  /**
   * Write a point moved by a bone.
   *
   * @param bone Bone index
   * @param p Source array
   * @param pi Offset of the point
   * @param out Target array, which may be the source
   * @param oi Offset to write at
   *
   * @evidence contracts/common.md#principled-implementation The rigid transform of a point.
   * @evidence contracts/common.md#clear-and-simple-design Array and offset in, array and offset out.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts At rest the point is copied exactly.
   * @evidence contracts/common.md#meaningful-documentation States the aliasing rule.
   * @evidence contracts/performance.md#efficient-algorithms Constant time, no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `bufferAutoMovieBones`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `bufferAutoMovieBones`.
   */
  apply(
    bone: number,
    p: ArrayLike<number>,
    pi: number,
    out: Float64Array,
    oi: number,
  ): void;

  /**
   * Write a direction turned by a bone.
   *
   * @param bone Bone index
   * @param v Source array
   * @param vi Offset of the direction
   * @param out Target array, which may be the source
   * @param oi Offset to write at
   *
   * @evidence contracts/common.md#principled-implementation The rotation of a direction.
   * @evidence contracts/common.md#clear-and-simple-design Array and offset in and out.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts At rest the direction is copied exactly.
   * @evidence contracts/common.md#meaningful-documentation States the aliasing rule.
   * @evidence contracts/performance.md#efficient-algorithms Constant time, no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `bufferAutoMovieBones`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `bufferAutoMovieBones`.
   */
  turn(
    bone: number,
    v: ArrayLike<number>,
    vi: number,
    out: Float64Array,
    oi: number,
  ): void;

  /** Each bone's rotation from rest to pose, `[x, y, z, w]` per bone. */
  rotations: Float64Array;
}
