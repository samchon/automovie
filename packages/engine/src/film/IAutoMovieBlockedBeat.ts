import {
  IAutoMovieBeatEndState,
  IAutoMovieBlocking,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";

/**
 * The result of `blockBeat`: either a validated blocking, the beat's shot plan
 * coherent with the script and the staged world and ready to steer the
 * performance stage, or every contradiction found in it.
 *
 * @evidence contracts/development/design.md#principled-representation A discriminated union on the literal `success`, so a caller cannot reach the plan without first proving the gate passed, and a failure always carries the complete violation list from one pass rather than the first error.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two variants with only what each outcome needs: the plan and its carried initial condition on success, the violations on failure, mirroring the engine's other stage results such as `IAutoMovieStagedSet`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No partially valid plan is returned: any violation selects the failure variant, so downstream stages never run on a blocking that only some checks accepted.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer and what each variant means for the caller.
 */
export type IAutoMovieBlockedBeat =
  | IAutoMovieBlockedBeat.ISuccess
  | IAutoMovieBlockedBeat.IFailure;

export namespace IAutoMovieBlockedBeat {
  /**
   * The plan holds together; performance can align to it.
   *
   * @evidence contracts/development/design.md#principled-representation Returned only when the beat id exists once in the script, every intent and carried actor is a staged node, the camera and coverage targets resolve, the duration is positive and finite, and each actor's anchors lie inside the beat in non-decreasing time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carries the plan and the validated prior end state together because the performance stage needs both to resume the world at the cut; nothing derived from the plan is precomputed here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The plan is returned as given rather than repaired or reordered, so the performance stage sees exactly what the author wrote and what the gate accepted.
   * @evidence contracts/development/common.md#meaningful-documentation States what success guarantees, that both members are the caller's own objects, and what `previous` seeds and when it is `null`.
   */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** The validated plan, the same object the caller passed in. */
    blocking: IAutoMovieBlocking;

    /**
     * The validated initial condition from the prior beat, the same object the
     * caller passed, or `null` when none was supplied, as for a first beat.
     * The performance stage seeds each actor's start position, facing,
     * articulation, gait phase, velocity, plants, and mount from it, so the
     * beat resumes where the previous one actually ended.
     */
    previous: IAutoMovieBeatEndState | null;
  }

  /**
   * The plan contradicted the script, the stage, or its own timeline.
   *
   * @evidence contracts/development/design.md#principled-representation Collects every violation the gate's single pass finds through one `ViolationCollector`, each with a JSON path into the blocking, script or previous end state, its expected bound and the offending value.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the list, because the correction round needs every contradiction at once and no partial plan to act on.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Violations are reported, never auto-corrected, so the author fixes the plan instead of the engine silently moving anchors or dropping intents.
   * @evidence contracts/development/common.md#meaningful-documentation States that the failure means a contradiction with the script, stage or timeline, and that the list is complete for the correction round.
   */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every contradiction found, in check order, for the correction round. */
    violations: IAutoMovieConstraintViolation[];
  }
}
