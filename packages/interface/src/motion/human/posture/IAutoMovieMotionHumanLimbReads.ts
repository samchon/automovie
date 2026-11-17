import type { IAutoMovieSkeletonPoseResolution } from "../../../pose/IAutoMovieSkeletonPoseResolution";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieHumanLimb } from "./AutoMovieHumanLimb";

/**
 * Contracts of `humanLimbReads`: what each limb's fit reads of a pose, read once from the rig.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the per-limb, per-placement membership sets and bound demand, and the pair indexing.
 * @evidence contracts/development/design.md#principled-representation A membership set and a bound demand per limb and placement, the two things a fit reads of a pose's bones.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Held by `IAutoMovieMotionHumanBody.reads`, made by `humanLimbReads` and read by the limb view and fit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose or answer is held; an attached goal's bone is the consumer's to add.
 */
export namespace IAutoMovieMotionHumanLimbReads {
  /**
   * One limb's reads under one placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three members.
   * @evidence contracts/development/design.md#principled-representation Bone names and the rig's own bound demand of the same names.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member has one reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Read-only sets.
   */
  export interface IRead {
    /** The bones whose records the limb's reduced pose keeps, closed under parents. */
    bones: ReadonlySet<AutoMovieHumanoidBone>;

    /** The bones the limb's source read demands. */
    requested: ReadonlySet<AutoMovieHumanoidBone>;

    /** The rig's bound demand of `requested`. */
    demand: IAutoMovieSkeletonPoseResolution.IBoneDemand;
  }

  /**
   * Every limb's reads: `[limb][0]` with the other arm not placed, `[limb][1]` with it placed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the indexing.
   * @evidence contracts/development/design.md#principled-representation A pair per limb, the placement being the one thing the sets vary by.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Made by `humanLimbReads` alone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every limb present.
   */
  export type IReads = Readonly<Record<AutoMovieHumanLimb, readonly [IRead, IRead]>>;
}
