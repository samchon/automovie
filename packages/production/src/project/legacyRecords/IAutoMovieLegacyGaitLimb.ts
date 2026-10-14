import type { AutoMovieEasing, AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * JSON-safe gait limb channel the v1 store performed against.
 *
 * @evidence contracts/common.md#principled-implementation A stored limb channel preserves bone, anatomical axis, phase, duty, degree amplitude and named easing; optional fields retain historical default meanings without executing them here.
 * @evidence contracts/common.md#clear-and-simple-design The legacy gait owns the channel list; this type keeps one stored channel separate from active engine gait computation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tuple easing or new runtime defaults are introduced into stored legacy data.
 * @evidence contracts/common.md#meaningful-documentation States phase and duty domains, degree units and optional axis/easing/neutral meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The channel shape executes no easing evaluation or angle oscillation; gait sampling owns that computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Phase and duty values define input behavior without sharing any prior sampled joint result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The containing gait owns these channel scalars and enums without streams, handles or asynchronous work.
 * @author Samchon
 */
export interface IAutoMovieLegacyGaitLimb {
  /**
   * The bone this limb's swing drives (a leg's upper bone).
   */
  bone: AutoMovieHumanoidBone;

  /**
   * Joint axis this gait channel writes. Omitted means `"flexion"` (the
   * sagittal swing); set `"abduction"` for side-to-side sway/spread or
   * `"twist"` for axial gait details.
   */
  axis?: "flexion" | "abduction" | "twist";

  /**
   * Where in the stride this limb's cycle starts, in `[0, 1)`: the phase offset
   * that distinguishes one gait's footfall sequence from another's.
   */
  phase: number;

  /**
   * Fraction of the stride the limb spends in **stance** (planted, pushing the
   * body back) versus **swing** (lifted, recovering forward), in `(0, 1)`. A
   * walk has a high duty (long ground contact); a gallop a low one.
   */
  duty: number;

  /**
   * Peak swing on `axis` (degrees) about the limb's neutral.
   */
  amplitude: number;

  /**
   * Easing used while the limb is in stance (planted, pushing back). Omitted
   * means `"linear"`.
   */
  stanceEasing?: AutoMovieEasing;

  /**
   * Easing used while the limb is in swing (recovering forward). Omitted means
   * `"linear"`.
   */
  swingEasing?: AutoMovieEasing;

  /**
   * Center the swing oscillates around (degrees), default `0`. A symmetric limb
   * (a hip, a shoulder) leaves this unset and swings `±amplitude` about zero; a
   * limb that only bends one way needs a nonzero center to keep the whole swing
   * on the anatomical side. A knee, whose flexion ROM is `[0, 150]°` and cannot
   * hyperextend, walks with e.g. `{ neutral: 25, amplitude: 18 }` so its swing
   * stays in `[7, 43]°` instead of crossing zero: the offset the ROM validator
   * forces once you try to bend a knee at all.
   */
  neutral?: number;
}
