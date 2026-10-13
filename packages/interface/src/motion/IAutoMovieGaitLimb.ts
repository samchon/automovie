import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import { AutoMovieEasing } from "./AutoMovieEasing";

/**
 * One limb's part in a gait cycle ({@link IAutoMovieGait}). The limbs differ only in **when** they swing (`phase`) and **how**: a horse walk is its four legs at phase offsets `0, 0.5, 0.25, 0.75` (lateral sequence), a trot at `0, 0.5, 0.5, 0` (diagonal pairs): same shape, different phases.
 *
 * @evidence contracts/common.md#principled-implementation A phase-shifted cycle divides at duty into stance and swing, each interpolating between opposite signed amplitudes about neutral; gaitLimbFlexion wraps phase, requires finite parameters and duty strictly between zero and one, and applies separate easing to the two intervals.
 * @evidence contracts/common.md#clear-and-simple-design One row drives one bone axis, defaulting to flexion, while gaitMotion folds different axes of a bone into one joint and refuses repeated bone-axis rows rather than overwriting them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Creature names do not select footfall timing or joint limits; phase and duty express the timing, neutral offsets express asymmetric joint use, and the resulting motion still faces the skeleton's range-of-motion validation.
 * @evidence contracts/common.md#meaningful-documentation Gives phase turns and wrapping, open duty bounds, degree amplitude and neutral, default axis and linear easing, cubic control ownership and the per-phase fallback when controls are absent.
 * @author Samchon
 */
export interface IAutoMovieGaitLimb {
  /** The bone this limb's swing drives (a leg's upper bone). */
  bone: AutoMovieHumanoidBone;

  /**
   * Joint axis this gait channel writes. Omitted means `"flexion"` so existing gait data keeps the original sagittal swing behavior; set `"abduction"` for side-to-side sway/spread or `"twist"` for axial gait details.
   */
  axis?: "flexion" | "abduction" | "twist";

  /**
   * Finite cycle-start offset in turns, wrapped modulo one. Offsets distinguish one gait's footfall sequence from another's.
   */
  phase: number;

  /**
   * Fraction of the stride the limb spends in **stance** (planted, pushing the body back) versus **swing** (lifted, recovering forward), in `(0, 1)`. A walk has a high duty (long ground contact); a gallop a low one.
   */
  duty: number;

  /** Finite signed peak swing on axis, in degrees, about neutral. */
  amplitude: number;

  /**
   * Easing used while the limb is in stance (planted, pushing back). Omitted means `"linear"`, preserving the original sawtooth.
   */
  stanceEasing?: AutoMovieEasing;

  /**
   * Cubic stance controls `[x1, y1, x2, y2]`; x values lie in `[0, 1]` and all values are finite. Missing controls make cubicBezier use linear ease.
   */
  stanceBezier?: [number, number, number, number] | null;

  /**
   * Easing used while the limb is in swing (recovering forward). Omitted means `"linear"`, preserving the original sawtooth.
   */
  swingEasing?: AutoMovieEasing;

  /**
   * Cubic swing controls `[x1, y1, x2, y2]`; x values lie in `[0, 1]` and all values are finite. Missing controls make cubicBezier use linear ease.
   */
  swingBezier?: [number, number, number, number] | null;

  /**
   * Center the swing oscillates around (degrees), default `0`. A symmetric limb (a hip, a shoulder) leaves this unset and swings `±amplitude` about zero; a limb that only bends one way needs a nonzero center to keep the whole swing on the anatomical side. A knee, whose flexion ROM is `[0, 150]°` and cannot hyperextend, walks with e.g. `{ neutral: 25, amplitude: 18 }` so its swing stays in `[7, 43]°` instead of crossing zero: the offset the ROM validator forces once you try to bend a knee at all.
   */
  neutral?: number;
}
