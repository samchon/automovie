import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * One stance target carried across a beat boundary by the ground-IK pass.
 *
 * `performShot` produces these through `plantStanceFeet` for an actor whose motion carries a gait cycle or resumed plants and whose rig has recognized feet, converting model-space targets to world space under staging's unit-scale, yaw-only actor transform. The default 24 Hz pass classifies foot Y at or below ground plus 0.02 m as stance and carries a prior target only into a detected opening stance. ROM-constrained or unreachable IK can leave residual, and interpolation between samples does not establish exact continuous contact.
 *
 * @evidence contracts/common.md#principled-implementation `pinStanceTargets` groups sampled contacts into maximal inclusive runs, takes a new run's first foot XZ and ground Y or the carried opening target, and shares that target across the run's sampled IK solves. `plantPerformShotStanceFeet` converts targets between model and world frames; the record describes the solve target, not measured achieved contact.
 * @evidence contracts/common.md#clear-and-simple-design Four fields, foot, run bounds and pinned point, are what the next beat's planting needs; the engine's internal plant output is mirrored here so the beat-end record stays in `interface` without importing engine types.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A carried target is preserved through frame conversion only for actual opening stance; it does not invent stance for a lifted foot or guarantee a constrained chain reaches its target. Missing recognized feet produce no plants, and nonfinite new or carried target coordinates throw in the planting pass.
 * @evidence contracts/common.md#meaningful-documentation States the producer and when it produces plants, the world-space conversion, how the next beat consumes them and why; members give the clock, inclusivity, unit and frame of each field.
 * @author Samchon
 */
export interface IAutoMovieBeatEndFootPlant {
  /** The planted foot bone. */
  foot: AutoMovieHumanoidBone;

  /** Inclusive sampled stance-run start, seconds on the performed clip clock, normally identical to the shot clock at zero performance offset. */
  start: number;

  /** Inclusive sampled stance-run end on the same clock as `start`. */
  end: number;

  /**
   * Fixed world-space IK target in meters across the run. A new target uses sampled ground height; a resumed target keeps its prior height even if the next ground source differs. The achieved foot may retain a residual.
   */
  position: IAutoMovieVector3;
}
