import type { ISpringStep } from "@automovie/engine";

/**
 * One axis's displayed angle and the solver state carried to the next frame.
 * Null keeps a never-authored, never-sprung axis absent; an existing spring may
 * still decay after its target disappears. State retention is the player's.
 *
 * @evidence contracts/common.md#principled-implementation Separates the nullable displayed joint angle from the damped solver's value/velocity state so a never-authored axis remains absent while existing history can decay after target removal.
 * @evidence contracts/common.md#clear-and-simple-design One result pair lets AutoMoviePlayer use the same axis settlement rule for flexion, abduction and twist.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null means absence of target and spring history, not a forced zero that would reset an active decay during a paused update.
 * @evidence contracts/common.md#meaningful-documentation Documents displayed degrees, null-state meaning and player ownership of the next solver state.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This axis result performs no integration; engine dampedSpring owns the numerical step.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result describes one update; the player decides state reuse between timestamps.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Numeric state is retained only through the player's bounded per-bone spring map and carries no native resources.
 */
export interface IAutoMovieSpringAxisSettlement {
  /**
   * Sprung pose angle in degrees, or null when both target and spring history are absent.
   */
  angle: number | null;

  /** Axis value and velocity retained by this player's per-joint spring map. */
  next: ISpringStep;
}
