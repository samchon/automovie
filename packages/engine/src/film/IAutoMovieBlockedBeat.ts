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
 * @evidence contracts/common.md#principled-implementation A discriminated union on the literal `success`, so a caller cannot reach the plan without first proving the gate passed, and a failure always carries the complete violation list from one pass rather than the first error.
 * @evidence contracts/common.md#clear-and-simple-design Two variants with only what each outcome needs: the plan and its carried initial condition on success, the violations on failure, mirroring the engine's other stage results such as `IAutoMovieStagedSet`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No partially valid plan is returned: any violation selects the failure variant, so downstream stages never run on a blocking that only some checks accepted.
 * @evidence contracts/common.md#meaningful-documentation States the producer and what each variant means for the caller.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime code; the gate's checks are answered on `blockBeat`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One result per `blockBeat` call; nothing caches blocking verdicts.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The variants reference the caller's blocking and end-state records or a new violation list; ownership is described on each variant.
 */
export type IAutoMovieBlockedBeat =
  | IAutoMovieBlockedBeat.ISuccess
  | IAutoMovieBlockedBeat.IFailure;

export namespace IAutoMovieBlockedBeat {
  /**
   * The plan holds together; performance can align to it.
   *
   * @evidence contracts/common.md#principled-implementation Returned only when the beat id exists once in the script, every intent and carried actor is a staged node, the camera and coverage targets resolve, the duration is positive and finite, and each actor's anchors lie inside the beat in non-decreasing time.
   * @evidence contracts/common.md#clear-and-simple-design Carries the plan and the validated prior end state together because the performance stage needs both to resume the world at the cut; nothing derived from the plan is precomputed here.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The plan is returned as given rather than repaired or reordered, so the performance stage sees exactly what the author wrote and what the gate accepted.
   * @evidence contracts/common.md#meaningful-documentation States what success guarantees, that both members are the caller's own objects, and what `previous` seeds and when it is `null`.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; the validation passes are answered on `blockBeat`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Produced per call and consumed by the same compile attempt.
   * @evidence contracts/performance.md#bound-retention-and-release-resources `blocking` and `previous` are the caller's objects by reference, not copies, so they live as long as the caller holds them and mutating one after the gate bypasses its checks.
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
   * @evidence contracts/common.md#principled-implementation Collects every violation the gate's single pass finds through one `ViolationCollector`, each with a JSON path into the blocking, script or previous end state, its expected bound and the offending value.
   * @evidence contracts/common.md#clear-and-simple-design Only the list, because the correction round needs every contradiction at once and no partial plan to act on.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Violations are reported, never auto-corrected, so the author fixes the plan instead of the engine silently moving anchors or dropping intents.
   * @evidence contracts/common.md#meaningful-documentation States that the failure means a contradiction with the script, stage or timeline, and that the list is complete for the correction round.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; collecting the violations is answered on `blockBeat`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Produced per call; nothing reuses a failed verdict.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns a new array of violation records, one per contradiction, released with the caller's result.
   */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every contradiction found, in check order, for the correction round. */
    violations: IAutoMovieConstraintViolation[];
  }
}
