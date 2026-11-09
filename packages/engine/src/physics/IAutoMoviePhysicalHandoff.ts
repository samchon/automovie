import type { IAutoMovieVector3 as V } from "@automovie/interface";

/**
 * Serialized relative-transform correction at a dynamic-to-authored boundary; native snapshots own actual bodies, while this record owns the remaining C1 return trajectory.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Serialized relative-transform correction at a dynamic-to-authored boundary; native snapshots own actual bodies, while this record owns the remaining C1 return trajectory) and documents 7 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Serialized relative-transform correction at a dynamic-to-authored boundary; native snapshots own actual bodies, while this record owns the remaining C1 return trajectory: interface of 7 members (`tick`, `duration`, `position`, `velocity`, `rotation`, `angularVelocity`, ...); units and frames named in its text: seconds, local, metres, radians. Optional members `completed` express documented absence, and the ranges its member docs state are left to runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMoviePhysicalHandoff` in packages/engine/src/physics/IAutoMoviePhysicalHandoff.ts; its surface is the 7 members listed and the text shows 5 other files naming it, mostly packages/engine (5), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export interface IAutoMoviePhysicalHandoff {
  /** Exact integer native tick immediately before switching ownership. */ tick: number;
  /** Positive authored return duration, seconds. */ duration: number;
  /** Parent-local inherited anchor error, or root displacement from the authored path, metres. */
  position: V;
  /** Parent-local derivative of the inherited displacement, m/s. */
  velocity: V;
  /** Parent-local rotation-vector displacement from the authored path, radians. */
  rotation: V;
  /** Derivative of the rotation vector, rad/s. */
  angularVelocity: V;
  /** Retain the final candidate through its path check before removing this record on the next step. */ completed?: boolean;
}
