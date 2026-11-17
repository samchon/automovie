import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieSuperposeMinimumJerk } from "../../IAutoMovieSuperposeMinimumJerk";

/**
 * How a strike follows its target: the goal planned at the launch from where
 * the target is predicted to be at contact, and then online corrections, each
 * a minimum-jerk unit superposed on the strike's goal, as the target is seen
 * to move.
 *
 * A performer observes the target every film frame from the launch. Each
 * observation predicts the target's point at contact by extrapolating its
 * current velocity (a first-order prediction, the simplest model of
 * interception of moving targets; Brenner and Smeets 1996), and the change
 * of that prediction since the previous observation is added to the goal by a
 * new minimum-jerk unit that starts one visuomotor correction latency after
 * the observation and ends at the contact (Flash and Henis 1991: a second unit
 * superposed on the first, not an aborted and re-planned movement; latency
 * 0.11 s, Prablanc and Martin 1992). Observations stop once a correction could
 * no longer run for its shortest duration before contact, so a target that
 * starts moving later than that is not followed: the strike lands on the line
 * it committed to, which is how a well-timed slip makes a punch miss, and why
 * a kick that commits at its chamber key (about one latency before impact)
 * sweeps through where the target was.
 *
 * A stationary target gives zero corrections and the planned goal unchanged;
 * a target moving at constant velocity is met exactly, because each
 * prediction is then exact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation launch: The launch, film seconds. impact: The contact, film seconds; after the launch. latency: The visuomotor correction latency, seconds.
 * @evidence contracts/development/design.md#principled-representation launch: The launch, film seconds. impact: The contact, film seconds; after the launch. latency: The visuomotor correction latency, seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: striking/StrikingAim.ts (StrikingAim.track, return); striking/StrikingAim.ts (StrikingAim.observations, timing); striking/StrikingAim.ts (StrikingAim.track, timing); striking/KickGeometry.ts (KickGeometry.build); striking/punchContact.ts (punchContact); striking/punchContact.ts (punchContact.solve).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieSuperposeMinimumJerk.IUnit identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanStrikingAim {
  /**
   * The timing of one strike's tracking, film seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and meaning.
   * @evidence contracts/development/design.md#principled-representation Film-second instants and second durations; the contact's order after the launch is checked by the observation schedule.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The five values the schedule and the corrections read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITiming {
    /** The launch, film seconds. */
    launch: number;

    /** The contact, film seconds; after the launch. */
    impact: number;

    /** The visuomotor correction latency, seconds. */
    latency: number;

    /** The observation period, seconds: one film frame. */
    step: number;

    /** The shortest correction unit, seconds. */
    shortest: number;
  }

  /**
   * One strike's tracking state, evaluated causally.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame, timebase and the causality it keeps.
   * @evidence contracts/development/design.md#principled-representation The planned goal in world metres and the corrections as functions of the film second, so no evaluation reads ahead of its second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The goal the reach solve reads and the units the stroke superposes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's unit type.
   */
  export interface ITracker {
    /** The goal predicted at the launch, world metres. */
    planned: IAutoMovieVector3;

    /**
     * The correction units that have started by a second, in observation
     * order; each reads observations only at or before its own start minus the
     * latency, so evaluating it never looks ahead of `seconds`.
     *
     * @param seconds Film seconds.
     * @returns The units, start and duration in film seconds.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the order, the causality and the timebase.
     * @evidence contracts/development/implementation.md#principled-implementation Each observation's change of prediction becomes one minimum-jerk unit from its start one latency later to the contact (Flash and Henis 1991).
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the observations, stopping at the first unit not yet started.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains every original observation in order through the exact start>seconds gate, original prediction differences, latency and impact-start duration; no correction unit, target read, time or displacement is approximated.
     * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the observations started by the second; predictions are memoised.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Each observation's prediction is computed once per tracker.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The memo holds at most one prediction per observation and is released with the tracker.
     */
    units(seconds: number): readonly IAutoMovieSuperposeMinimumJerk.IUnit[];

    /**
     * The goal including every correction that has started by a second.
     *
     * @param seconds Film seconds.
     * @returns World metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what is included and the frame.
     * @evidence contracts/development/implementation.md#principled-implementation The planned goal plus every started unit's full displacement.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared started-observation iterator first collects the actual ordered displacements, then the original left fold adds them to planned.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses every original started correction, snapshots all prediction differences before folding and keeps the exact ordered Vector3.add accumulation; zero corrections still return the exposed planned reference and no goal or fit answer is substituted.
     * @evidence contracts/development/implementation.md#efficient-algorithms Retains O(K) observation/difference/fold work and temporary displacement vectors for K started observations, omitting K unused timed-unit records while retaining original duration field reads/arithmetic for raw observation order. No measured speedup is claimed.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same actual started-observation owner and memoised predictions as units. All target/timing callbacks, original duration reads and displacement snapshots still precede the original fold, preserving raw observation order and later changes to the exposed planned vector; no accumulated goal is cached.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary displacement vectors/array end on return or failure. The original bounded prediction memo stays tracker-owned; with no started corrections the original planned reference is returned unchanged.
     */
    goal(seconds: number): IAutoMovieVector3;
  }
}
