import type { IAutoMovieResolvedBone } from "../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../skeleton/AutoMovieHumanoidBone";

/**
 * Each bone's rigid motion from rest to the current pose in arrays, from
 * `bufferAutoMovieBones`, refreshed per pose without allocation.
 *
 * Bone `b` carries a point `p` to `P_b + Q_b R_b^-1 (p - O_b)` and a direction
 * by `Q_b R_b^-1` alone. This is the rigid point transform used when\n * posing a sweep.
 * Before the first `update`, and after `reset`, every motion is the identity,
 * applied as an exact copy.
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
   */
  index(bone: AutoMovieHumanoidBone): number;

  /**
   * Take each bone's motion from rest to `posed`.
   *
   * @param posed The same bones as the rest list, in the same order
   * @throws Error when the lists differ in length or in a bone
   */
  update(posed: readonly IAutoMovieResolvedBone[]): void;

  /** Return every motion to the identity, the rest pose. */
  reset(): void;

  /**
   * Write a point moved by a bone.
   *
   * @param bone Bone index
   * @param p Source array
   * @param pi Offset of the point
   * @param out Target array, which may be the source
   * @param oi Offset to write at
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
