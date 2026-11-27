import type { IAutoMovieSkeletonPoseResolution } from "../pose/IAutoMovieSkeletonPoseResolution";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieHumanLimb } from "./AutoMovieHumanLimb";

/**
 * Contracts of `humanLimbReads`: what each limb's fit reads of a pose, read
 * once from the rig.
 */
export namespace IAutoMovieMotionHumanLimbReads {
  /** One limb's reads under one placement. */
  export interface IRead {
    /**
     * The bones whose records the limb's reduced pose keeps, closed under
     * parents.
     */
    bones: ReadonlySet<AutoMovieHumanoidBone>;

    /** The bones the limb's source read demands. */
    requested: ReadonlySet<AutoMovieHumanoidBone>;

    /** The rig's bound demand of `requested`. */
    demand: IAutoMovieSkeletonPoseResolution.IBoneDemand;
  }

  /**
   * Every limb's reads: `[limb][0]` with the other arm not placed, `[limb][1]`
   * with it placed.
   */
  export type IReads = Readonly<
    Record<AutoMovieHumanLimb, readonly [IRead, IRead]>
  >;
}
