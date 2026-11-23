import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieEasing } from "./AutoMovieEasing";

/**
 * One limb's part in a gait cycle ({@link IAutoMovieGait}). The limbs differ
 * only in **when** they swing (`phase`) and **how**: a horse walk is its four
 * legs at phase offsets `0, 0.5, 0.25, 0.75` (lateral sequence), a trot at `0,
 * 0.5, 0.5, 0` (diagonal pairs): same shape, different phases.
 */
export interface IAutoMovieGaitLimb {
  /** The bone this limb's swing drives (a leg's upper bone). */
  bone: AutoMovieHumanoidBone;

  /**
   * Joint axis this gait channel writes. Omitted means `"flexion"` so existing
   * gait data keeps the original sagittal swing behavior; set `"abduction"` for
   * side-to-side sway/spread or `"twist"` for axial gait details.
   */
  axis?: "flexion" | "abduction" | "twist";

  /**
   * Finite cycle-start offset in turns, wrapped modulo one. Offsets distinguish
   * one gait's footfall sequence from another's.
   */
  phase: number;

  /**
   * Fraction of the stride assigned to nominal **stance** versus **swing**, in
   * `(0, 1)`. These intervals shape the joint oscillation; they do not
   * constrain a resolved foot to the ground. A walk commonly uses a longer
   * nominal stance fraction than a gallop.
   */
  duty: number;

  /**
   * Finite signed oscillation endpoint on axis, in degrees, about neutral;
   * cubic easing may overshoot it.
   */
  amplitude: number;

  /**
   * Easing used during the nominal stance interval. Omitted means `"linear"`,
   * preserving the original sawtooth.
   */
  stanceEasing?: AutoMovieEasing;

  /**
   * Cubic stance controls `[x1, y1, x2, y2]`; callers must supply x values in
   * `[0, 1]` and finite values throughout. Direct gait evaluation checks used
   * controls for finiteness but does not check their x range. Missing controls
   * make cubicBezier use linear ease; finite y controls may overshoot.
   */
  stanceBezier?: [number, number, number, number] | null;

  /**
   * Easing used during the nominal swing interval. Omitted means `"linear"`,
   * preserving the original sawtooth.
   */
  swingEasing?: AutoMovieEasing;

  /**
   * Cubic swing controls `[x1, y1, x2, y2]`; callers must supply x values in
   * `[0, 1]` and finite values throughout. Direct gait evaluation checks used
   * controls for finiteness but does not check their x range. Missing controls
   * make cubicBezier use linear ease; finite y controls may overshoot.
   */
  swingBezier?: [number, number, number, number] | null;

  /**
   * Center the swing oscillates around (degrees), default `0`. With bounded
   * easing, a symmetric limb swings between `±amplitude` about zero, while a
   * one-sided joint can use a nonzero center. For a knee with flexion ROM `[0,
   * 150]°`, `{ neutral: 25, amplitude: 18 }` and default linear easing produce
   * `[7, 43]°`; cubic y overshoot can exceed those endpoints, and the selected
   * skeleton's ROM remains a separate constraint.
   */
  neutral?: number;
}
