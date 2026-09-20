import { IAutoMovieConstraintViolation, IAutoMovieMountBinding, IAutoMovieScene } from "@automovie/interface";

/**
 * A staged film set: the composed {@link IAutoMovieScene} plus the persistent
 * mount couplings staging declared. Mounts stay alongside rather than inside
 * the scene because a scene node is a flat world placement, the per-frame world
 * transform of a mounted rider comes from `resolveAttachment` against the
 * parent's posed skeleton, not from the scene graph.
 *
 * `performShot` consumes these: every performed shot auto-descends each mount
 * into the rider's follow clip through `compileAttach` (#674), so the rider
 * rides for the whole film without re-issuing `attachTo`, the engine owns the
 * composition, the host stays a pure player.
 *
 * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay Carries the resolved scene or addressed validation result produced from the script and staging plan.
 * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieStagedSet preserves deterministic success and failure outcomes for the same authored staging inputs.
 * @author Samchon
 */
export type IAutoMovieStagedSet =
  | IAutoMovieStagedSet.ISuccess
  | IAutoMovieStagedSet.IFailure;

export namespace IAutoMovieStagedSet {
  /**
   * Staging was coherent; the set is ready for blocking/performance.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay The success branch carries one coherent resolved set for the blocking pass.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieStagedSet.ISuccess makes the deterministic resolved-scene outcome explicit.
   */
  export interface ISuccess {
    /**
     * Discriminator.
     *
     * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay The success discriminator separates a resolved staged set from an addressed failure result.
     * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieStagedSet.ISuccess.success fixes the status of the deterministic staging outcome.
     */
    success: true;

    /**
     * The composed scene (actors at rest, cameras aimed, lights rigged).
     *
     * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay Carries the resolved scene produced from the declared staging plan without hidden mutation.
     * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieStagedSet.ISuccess.scene exposes the replayable scene state consumed by blocking.
     */
    scene: IAutoMovieScene;

    /**
     * Validated persistent couplings, one per mounted rider.
     *
     * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay Carries the validated mount bindings produced alongside the resolved scene.
     * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieStagedSet.ISuccess.mounts keeps coupling inputs stable across replay and beat-end handoff.
     */
    mounts: IMount[];
  }

  /**
   * Staging contradicted the script or itself; nothing was composed.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay Carries deterministic validation failure when the plan cannot form a coherent set.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieStagedSet.IFailure preserves the non-playable staging result rather than fabricating a scene.
   */
  export interface IFailure {
    /**
     * Discriminator.
     *
     * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay The failure discriminator prevents an invalid staging result from masquerading as a resolved set.
     * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieStagedSet.IFailure.success prevents a failed set from entering blocking.
     */
    success: false;

    /**
     * Every contradiction found, for the correction round.
     *
     * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay Carries every addressed staging contradiction produced by the deterministic validation pass.
     * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieStagedSet.IFailure.violations supplies the correction data instead of a partial resolved scene.
     */
    violations: IAutoMovieConstraintViolation[];
  }

  /**
   * One rider→parent-bone coupling. `performShot` bakes it into the rider's
   * per-frame follow clip (#674); the host plays that clip, it does not resolve
   * the coupling itself.
   *
   * @evidence requirements/motion/object-motion-and-interaction.md#motion-coupled-objects IAutoMovieStagedSet.IMount preserves declared attachment handoff: One rider→parent-bone coupling. `performShot` bakes it into the rider's per-frame follow clip (#674); the host plays that clip, it does not resolve the coupling itself.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAutoMovieStagedSet.IMount realizes declared attachment and object handoff: One rider→parent-bone coupling. `performShot` bakes it into the rider's per-frame follow clip (#674); the host plays that clip, it does not resolve the coupling itself.
   */
  export interface IMount {
    /**
     * The mounted (riding) scene node.
     *
     * @evidence requirements/motion/object-motion-and-interaction.md#motion-coupled-objects IAutoMovieStagedSet.IMount.node preserves declared attachment handoff: The mounted (riding) scene node.
     * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAutoMovieStagedSet.IMount.node realizes declared attachment and object handoff: The mounted (riding) scene node.
     */
    node: string;

    /**
     * The coupling it rides.
     *
     * @evidence requirements/motion/object-motion-and-interaction.md#motion-coupled-objects IAutoMovieStagedSet.IMount.binding preserves declared attachment handoff: The coupling it rides.
     * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff IAutoMovieStagedSet.IMount.binding realizes declared attachment and object handoff: The coupling it rides.
     */
    binding: IAutoMovieMountBinding;
  }
}
