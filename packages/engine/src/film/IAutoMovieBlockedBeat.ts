import { IAutoMovieBeatEndState, IAutoMovieBlocking, IAutoMovieConstraintViolation } from "@automovie/interface";

export type IAutoMovieBlockedBeat =
  | IAutoMovieBlockedBeat.ISuccess
  | IAutoMovieBlockedBeat.IFailure;
export namespace IAutoMovieBlockedBeat {
  /**
   * The plan holds together; performance can align to it.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-blocking-relations IAutoMovieBlockedBeat.ISuccess makes authored blocking mechanically validatable: The plan holds together; performance can align to it.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership IAutoMovieBlockedBeat.ISuccess realizes staged spatial-relation validation: The plan holds together; performance can align to it.
   */
  export interface ISuccess {
    /**
     * Discriminator.
     *
     * @evidence requirements/staging/marks-zones-and-blocking.md#staging-blocking-relations The true discriminator admits the validated beat plan to performance compilation.
     * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership IAutoMovieBlockedBeat.ISuccess.success admits a spatially coherent beat plan to performance compilation.
     */
    success: true;

    /**
     * The validated plan, verbatim.
     *
     * @evidence requirements/staging/marks-zones-and-blocking.md#staging-blocking-relations IAutoMovieBlockedBeat.ISuccess.blocking makes authored blocking mechanically validatable: The validated plan, verbatim.
     * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership IAutoMovieBlockedBeat.ISuccess.blocking realizes staged spatial-relation validation: The validated plan, verbatim.
     */
    blocking: IAutoMovieBlocking;

    /**
     * The validated initial condition from the prior beat, or `null` for the
     * first beat (or when none was supplied). Surfaced so the performance stage
     * seeds each actor's start position, facing, articulation, gait phase,
     * velocity, plants, and mount from where the previous beat actually ended.
     *
     * @evidence requirements/story/scenes-and-observable-action.md#story-scene-boundary-continuity Carries the prior beat's measured placement, facing, motion, plant, and mount state as this beat's explicit opening condition.
     * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff IAutoMovieBlockedBeat.ISuccess.previous preserves the authored state handoff instead of resetting the world at the cut.
     */
    previous: IAutoMovieBeatEndState | null;
  }

  /**
   * The plan contradicted the script, the stage, or its own timeline.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-blocking-relations IAutoMovieBlockedBeat.IFailure makes authored blocking mechanically validatable: The plan contradicted the script, the stage, or its own timeline.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership IAutoMovieBlockedBeat.IFailure realizes staged spatial-relation validation: The plan contradicted the script, the stage, or its own timeline.
   */
  export interface IFailure {
    /**
     * Discriminator.
     *
     * @evidence requirements/staging/marks-zones-and-blocking.md#staging-blocking-relations The false discriminator keeps a contradictory beat plan outside performance compilation.
     * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership IAutoMovieBlockedBeat.IFailure.success marks contradictory blocking as non-playable.
     */
    success: false;

    /**
     * Every contradiction found, for the correction round.
     *
     * @evidence requirements/staging/marks-zones-and-blocking.md#staging-blocking-relations Returns addressed beat, stage, camera, timing, and boundary-state contradictions for the next blocking attempt.
     * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership IAutoMovieBlockedBeat.IFailure.violations realizes staged spatial-relation validation: Every contradiction found, for the correction round.
     */
    violations: IAutoMovieConstraintViolation[];
  }
}
