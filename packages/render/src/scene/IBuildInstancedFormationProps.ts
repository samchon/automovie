import type {
  IAutoMovieCompiledFormation,
  IAutoMovieFormationMotion,
  IAutoMovieFormationSlotMotion,
  IAutoMovieModel,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * Compiled formation, prototype models and sparse scene participants.
 * Model and scene-object maps stay caller-owned; construction binds compact
 * membership and motion inputs before creating persistent tier batches.
 *
 * @evidence contracts/development/design.md#principled-representation A compiled compact formation references runtime models and sparse motion/hero maps; anonymous slots are regenerated from compiled identity while promoted heroes remain ordinary caller-owned scene participants.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Separates shared unit cues, sparse member exceptions, hero staging wrappers and actual visual roots so placement and culling read the correct source frames.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Slot-cue membership is fixed at construction instead of being reinterpreted after a caller swaps the list; missing referenced runtime models refuse in the builder.
 * @evidence contracts/development/common.md#meaningful-documentation Documents compiled model references, caller ownership, shared versus sparse cues, rebuild requirements for changed exception membership and the distinction between hero wrappers and visual roots.
 */
export interface IBuildInstancedFormationProps {
  /** Compiled compact identity, layout, anchor and available tiers. */
  formation: IAutoMovieCompiledFormation;

  /** Actual runtime models keyed by the identities referenced by those tiers. */
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
