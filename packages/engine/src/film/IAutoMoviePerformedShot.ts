import { IAutoMovieBeatEndFootPlant, IAutoMovieConstraintViolation, IAutoMovieMotion, IAutoMovieShot } from "@automovie/interface";

export type IAutoMoviePerformedShot =
  | IAutoMoviePerformedShot.ISuccess
  | IAutoMoviePerformedShot.IFailure;
export namespace IAutoMoviePerformedShot {
  /**
   * The performance compiled and every clip passed validation.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMoviePerformedShot.ISuccess supports reproducible staging and performance: The performance compiled and every clip passed validation.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMoviePerformedShot.ISuccess realizes deterministic staging replay and validation: The performance compiled and every clip passed validation.
   */
  export interface ISuccess {
    /**
     * Discriminator.
     *
     * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay The success discriminator keeps successful and failed performed-shot replay outcomes structurally distinct.
     * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMoviePerformedShot.ISuccess.success admits the compiled shot and validated motion bundle to editing.
     */
    success: true;

    /**
     * The shot, ready for the cut.
     *
     * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMoviePerformedShot.ISuccess.shot supports reproducible staging and performance: The shot, ready for the cut.
     * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMoviePerformedShot.ISuccess.shot realizes deterministic staging replay and validation: The shot, ready for the cut.
     */
    shot: IAutoMovieShot;

    /**
     * The synthesised per-actor clips, keyed by scene-node id.
     *
     * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMoviePerformedShot.ISuccess.motions supports reproducible staging and performance: The synthesised per-actor clips, keyed by scene-node id.
     * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMoviePerformedShot.ISuccess.motions realizes deterministic staging replay and validation: The synthesised per-actor clips, keyed by scene-node id.
     */
    motions: Record<string, IAutoMovieMotion>;

    /**
     * Ground-IK stance runs produced for gait or resumed opening plants.
     *
     * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMoviePerformedShot.ISuccess.plants supports reproducible staging and performance: Ground-IK stance runs produced for gait or resumed opening plants.
     * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMoviePerformedShot.ISuccess.plants realizes deterministic staging replay and validation: Ground-IK stance runs produced for gait or resumed opening plants.
     */
    plants: Array<{
      /** Scene node owning these world-space plant runs. */
      node: string;
      /** Current-shot stance runs carried into the next beat. */
      plants: IAutoMovieBeatEndFootPlant[];
    }>;
  }

  /**
   * The action list contradicted the stage, or a compiled clip broke ROM.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-failure-status Withholds the performed shot when an action contradicts the staged world or a synthesized clip fails its motion gate, preserving an actionable failure branch.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMoviePerformedShot.IFailure realizes deterministic staging replay and validation: The action list contradicted the stage, or a compiled clip broke ROM.
   */
  export interface IFailure {
    /**
     * Discriminator.
     *
     * @evidence requirements/staging/budgets-safety-and-validation.md#staging-failure-status The success discriminator keeps successful and failed performance failure outcomes structurally distinct.
     * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMoviePerformedShot.IFailure.success prevents failed synthesis from yielding a playable shot.
     */
    success: false;

    /**
     * Every violation found, for the correction round.
     *
     * @evidence requirements/staging/budgets-safety-and-validation.md#staging-failure-status Returns addressed action-reference, synthesis, range-of-motion, and plant failures instead of a partial performed shot.
     * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMoviePerformedShot.IFailure.violations realizes deterministic staging replay and validation: Every violation found, for the correction round.
     */
    violations: IAutoMovieConstraintViolation[];
  }
}
