import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalRecoveryState } from "./IAutoMoviePhysicalRecoveryState";

/**
 * Recovery policy, checkpoint state and one tick's plain controller result.
 * The controller mutates its caller-owned state; results share that same state.
 *
 * @evidence contracts/development/design.md#principled-representation Distinguish proposed swings, measured landing acceptance and authored ownership handoffs so checkpoint continuation does not treat a requested step as completed contact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface advancePhysicalBalance shares the authored footfall pattern while simulation admission supplies optional controller defaults. advancePhysicalBalance mutates this caller-owned state and checkpoint replay preserves the same history rather than reconstructing it from a requested goal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Landing requires loaded support, position and speed checks; timeout records failure, and bracing requests bounded target changes rather than fabricated support.
 * @evidence contracts/development/common.md#meaningful-documentation Specifies recovery-step geometry, timing, force limits, landing gates and optional bracing defaults. Distinguishes pending steps, confirmed landings, authored handoffs, recovery clocks and mutable checkpoint ownership.
 */
export namespace IAutoMovieAdvancePhysicalBalance {
  /**
   * Advance one body's generic recovery controller from actual floor manifolds.
   * Root tracking is withdrawn on unrecoverable support loss. Recovery requests
   * use the shared support-swing interpolator and bounded endpoint motors; their
   * completed placements remain offsets on subsequent authored goals, so the
   * planner and physical support do not snap apart at landing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the shared mutable controller state, fresh goal map and optional bracing correction.
   * @evidence contracts/development/design.md#principled-representation World-metre goals and horizontal root displacement are motor intent; rootStrength is the exhaustion/bracing multiplier.
   * @evidence contracts/development/design.md#minimal-and-owned-surface advancePhysicalBalance returns state by identity for checkpoint continuation and goals for the physical target planners.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A goal requests tracking without certifying support contact; absence of rootShift means no bracing correction was requested.
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
  };
}
