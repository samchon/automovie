import type { IAutoMovieCompiledFormation, IAutoMovieFormationMotion, IAutoMovieFormationSlotMotion, IAutoMovieModel } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Compiled formation, prototype models and sparse scene participants.
 * Model and scene-object maps stay caller-owned; construction binds compact
 * membership and motion inputs before creating persistent tier batches.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-group-motion-model-selection Carries the compiled group and authored motion cues used to select the actual formation performance.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Keeps group cues, sparse member exceptions and promoted hero projections explicit at construction.
 * @author Samchon
 */
export interface IBuildInstancedFormationProps {
  /** Compiled compact identity, layout, anchor and available tier recipes. */
  formation: IAutoMovieCompiledFormation;

  /** Actual runtime models keyed by the identities referenced by those recipes. */
  models: ReadonlyMap<string, IAutoMovieModel>;

  /** Authored group cues sampled for placement and shared gait cadence. */
  motions?: readonly IAutoMovieFormationMotion[];

  /**
   * Sparse per-member cues, so one member of a crowd can do what its neighbours
   * do not: leave, stop, step out, or stop being drawn at all.
   *
   * Read once, here. Which members the cues single out is settled while the
   * batches are built, so a caller that swapped this list afterwards would be
   * sampling cues against a set of exceptions that no longer answers to them;
   * rebuild the unit instead.
   */
  slotMotions?: readonly IAutoMovieFormationSlotMotion[];

  /** Explicit scene wrappers keyed by promoted hero actor id. */
  heroObjects?: ReadonlyMap<string, THREE.Object3D>;

  /** Pose-root objects whose actual world positions drive hero culling. */
  heroVisualObjects?: ReadonlyMap<string, THREE.Object3D>;
}
