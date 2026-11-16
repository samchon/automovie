import type {
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "./Quaternion";

/**
 * The one constructor of {@link IAutoMovieTransform} records: a translation,
 * a rotation and a per-axis scale, metres, a unit quaternion and
 * dimensionless factors.
 *
 * A frame that does not scale carries the unit scale, `(1, 1, 1)`; it is
 * written here once instead of at every site that builds a frame. Every
 * function returns a new record, because callers spread and build on the
 * frames they are given and must never alias one shared record.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the record holds, its units, the unit scale's meaning and that every call returns a new record.
 * @evidence contracts/development/design.md#principled-representation The interface's transform record built from its three parts, the scale defaulting to the identity of scaling.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two members: the identity transform and the transform of given parts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shared constant record: each frame owns its components, as `Quaternion.identity` does.
 */
export namespace Transform {
  /**
   * A new identity transform: no translation, no rotation and the unit scale.
   *
   * @returns The transform.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three parts and that each call returns a new record.
   * @evidence contracts/development/implementation.md#principled-implementation The neutral element of composing transforms: the zero translation, the identity rotation and the unit scale.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `of` with the zero translation and the identity rotation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Returns the same exact value for every call, never a cached record.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three literal parts in constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A fresh record is the contract, so sharing one would be wrong rather than cheaper.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each record owns its components and nothing is retained.
   */
  export const identity: () => IAutoMovieTransform = (): IAutoMovieTransform =>
    of({ x: 0, y: 0, z: 0 }, Quaternion.identity());

  /**
   * A new transform of a translation and a rotation, and a scale that is the
   * unit scale when absent.
   *
   * @param translation World or parent-frame metres.
   * @param rotation A unit quaternion.
   * @param scale Per-axis factors, strictly positive; `(1, 1, 1)` when absent.
   * @returns The transform.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each part's unit, the scale's default and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The record of its three parts, the unscaled frame's scale the identity of scaling.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal from the parts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The parts are taken as given; the scale's positivity is the caller's premise, which the engine's transform validation checks.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One record in constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure constructor of its arguments.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new record; the default scale is new on each call.
   */
  export function of(
    translation: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
    scale: IAutoMovieVector3 = { x: 1, y: 1, z: 1 },
  ): IAutoMovieTransform {
    return { translation, rotation, scale };
  }
}
