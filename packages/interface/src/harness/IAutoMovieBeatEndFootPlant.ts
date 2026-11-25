import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * One stance target carried across a beat boundary by the ground-IK pass.
 *
 * `performShot` produces these through `plantStanceFeet` for an actor whose
 * motion carries a gait cycle or resumed plants and whose rig has recognized
 * feet, converting model-space targets to world space under staging's
 * unit-scale, yaw-only actor transform. The default 24 Hz pass classifies foot
 * Y at or below ground plus 0.02 m as stance and carries a prior target only
 * into a detected opening stance. ROM-constrained or unreachable IK can leave
 * residual, and interpolation between samples does not establish exact
 * continuous contact.
 */
export interface IAutoMovieBeatEndFootPlant {
  /** The planted foot bone. */
  foot: AutoMovieHumanoidBone;

  /**
   * Inclusive sampled stance-run start, seconds on the performed clip clock,
   * normally identical to the shot clock at zero performance offset.
   */
  start: number;

  /** Inclusive sampled stance-run end on the same clock as `start`. */
  end: number;

  /**
   * Fixed world-space IK target in meters across the run. A new target uses
   * sampled ground height; a resumed target keeps its prior height even if the
   * next ground source differs. The achieved foot may retain a residual.
   */
  position: IAutoMovieVector3;
}
