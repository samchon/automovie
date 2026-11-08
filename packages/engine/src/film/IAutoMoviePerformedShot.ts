import {
  IAutoMovieBeatEndFootPlant,
  IAutoMovieConstraintViolation,
  IAutoMovieMotion,
  IAutoMovieShot,
} from "@automovie/interface";

/**
 * What `performShot` returns: the assembled {@link IAutoMovieShot} with the
 * dense motion clips the synthesizer produced for it, or every violation that
 * stopped the performance at its first failing gate group.
 *
 * The clips travel beside the shot because the shot references them by id and
 * the host registers them in whatever clip store it keeps.
 *
 * @evidence contracts/development/design.md#principled-representation A discriminated union on the literal `success`; `performShot` runs its gates in dependency order (input references, launches, motion validation, coupling, authored object clips, camera clearance) and returns the violations of the first gate group that collected any, and a success is returned only after `validateShotArtifact` accepted the shot against the same scene and clip ids, an engine defect throwing rather than becoming a violation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The success-or-violations shape every engine stage gate returns, with the success branch carrying the three outputs `compileDefinedShot` consumes next: the shot, its clips and the plant runs continuity resumes from.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No partial shot is returned: a single unresolved target, overlapping frame span, unreachable launch or ROM breach refuses the whole performance, and an engine-side artifact fault throws instead of being reported as the author's.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, why clips travel beside the shot, and that the failure branch carries the violations of the first failing gate group.
 */
export type IAutoMoviePerformedShot =
  | IAutoMoviePerformedShot.ISuccess
  | IAutoMoviePerformedShot.IFailure;

export namespace IAutoMoviePerformedShot {
  /**
   * The performance compiled, every clip passed `validateMotion`, and the
   * assembled shot passed the shot artifact contract.
   *
   * @evidence contracts/development/design.md#principled-representation `motions` holds the synthesized clip per performing node, replaced by the stance-planted clip where `plantStanceFeet` established foot plants; plant positions are converted from model space to world space through the node's staged transform, so a later beat can resume them regardless of the next stage's placement.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Shot, clips and plant runs are kept apart because the shot is the renderer's artifact, the clips go to the host's store, and the plants feed only continuity sampling.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A rig with no recognized foot effectors keeps its authored clip and adds no plant run, rather than receiving invented plants, and plant runs are ordered by node id in code-unit order so the output does not depend on object key order.
   * @evidence contracts/development/common.md#meaningful-documentation States what the branch certifies, how `motions` is keyed, which actors receive plant runs, their order and world-space frame.
   */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** The assembled shot, ready for the cut. */
    shot: IAutoMovieShot;

    /**
     * The synthesized clip per performing scene node, keyed by node id. A
     * planted actor's entry is its stance-planted clip.
     */
    motions: Record<string, IAutoMovieMotion>;

    /**
     * World-space foot-plant runs, one entry per actor whose motion carries a
     * gait cycle or resumed opening plants and whose rig has recognized feet,
     * ordered by node id.
     */
    plants: Array<{
      /** Scene node owning these plant runs. */
      node: string;

      /** This shot's stance runs, carried into the next beat's opening. */
      plants: IAutoMovieBeatEndFootPlant[];
    }>;
  }

  /**
   * The action list contradicted the staged world, blocking or runtime
   * capabilities, or a compiled clip broke its rig's range of motion; no shot
   * was assembled. The list holds every violation of the first gate group that
   * failed; later gates did not run.
   *
   * @evidence contracts/development/design.md#principled-representation Violations are collected per gate group with paths into the performance input (`$input...`); a range-of-motion breach found by `validateMotion` is re-rooted onto `$compiled["<node>"]`, the synthesized clip of that node, and a masked channel onto the authoring action's `region`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The list is the only payload because a refused performance has nothing to render.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No violation is suppressed by verb or actor, and a masked channel dropped by an action's `region` is reported rather than discarded silently.
   * @evidence contracts/development/common.md#meaningful-documentation States the families of failure the branch carries, that it stops at the first failing gate group, and that no shot exists on it.
   */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /**
     * Every violation of the failing gate group, with paths into the
     * performance input (`$input...`) or a synthesized clip
     * (`$compiled["<node>"]...`).
     */
    violations: IAutoMovieConstraintViolation[];
  }
}
