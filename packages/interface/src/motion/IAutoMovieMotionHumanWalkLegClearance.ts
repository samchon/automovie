import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieMotionHumanLegChain } from "./IAutoMovieMotionHumanLegChain";

/**
 * How far two legs of one body pass into each other, read as the tangle audit
 * reads them: each leg posed as the posture shows it (its hip, knee and ankle
 * and its thigh's and shank's rotations, `HumanLegChain`, and its foot's
 * rotation), and the deepest probe of either leg's thigh, shank, foot or toes
 * in a segment of the other beyond the probe's own reference depth there
 * (`AutoMovieMotionHumanAuditTangleModel.excess`). A planner that keeps it
 * within the audit's give (`AutoMovieMotionHumanAuditTangleModel.BUILT`) keeps
 * two legs that cross, as a sideways recovery's do, clear of each other where
 * the audit would find them run through each other.
 */
export namespace IAutoMovieMotionHumanWalkLegClearance {
  /**
   * A leg as posed (`IAutoMovieMotionHumanLegChain.IPosed`) with its side and
   * its foot.
   */
  export interface ILeg extends IAutoMovieMotionHumanLegChain.IPosed {
    /** The leg. */
    side: "left" | "right";

    /** The foot's world rotation from its rest. */
    rotation: IAutoMovieQuaternion;
  }
}
