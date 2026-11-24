import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalRecoveryState } from "./IAutoMoviePhysicalRecoveryState";

/**
 * Recovery policy, checkpoint state and one tick's plain controller result.
 * The controller mutates its caller-owned state; results share that same state.
 */
export namespace IAutoMovieAdvancePhysicalBalance {
  /**
   * Advance one body's generic recovery controller from actual floor manifolds.
   * Root tracking is withdrawn on unrecoverable support loss. Recovery requests
   * use the shared support-swing interpolator and bounded endpoint motors; their
   * completed placements remain offsets on subsequent authored goals, so the
   * planner and physical support do not snap apart at landing.
   */
  export type IResult = {
    /** Root-tracking multiplier, currently zero or one according to exhaustion/bracing policy. */
    rootStrength: number;
    /** World horizontal root-target correction in metres, present only with bracing policy. */
    rootShift?: IAutoMovieVector3;
    /** Same mutable input state after this tick's swing/landing/ownership updates. */
    state: IAutoMoviePhysicalRecoveryState;
    /** New map of world support-point goals in metres for active or retained recovery owners. */
    goals: Record<string, IAutoMovieVector3>;
    /**
     * A lifted swing's path as its drive takes it, metres: the clearance it
     * rises by and how much further its lowest point hangs below its endpoint
     * than when planted, so the joints' reference is fit to the same path.
     * Absent while no limb swings. A second lifted swing, as a quadruped's gait
     * swings two legs at once, has its own, as `pair`.
     */
    swing?: {
      height: number;
      hang: number;
      pair?: { height: number; hang: number };
    };
  };
}
