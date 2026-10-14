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
   * Historical joint-axis choice: flexion for sagittal swing, abduction for lateral swing, or twist for axial motion. Omission carries the historical flexion interpretation without applying a storage default.
   */
  axis?: "flexion" | "abduction" | "twist";

  /**
   * Historical stride phase in [0, 1), describing this limb's cycle offset without sampling it here.
   */
  phase: number;

  /**
   * Historical stance fraction in (0, 1), with the remainder describing swing. Storage supplies no contact or footfall proof.
   */
  duty: number;

  /**
   * Peak swing on `axis` (degrees) about the limb's neutral.
   */
  amplitude: number;

  /**
   * Historical stance easing; omission carries the linear interpretation without inserting or evaluating an easing here.
   */
  stanceEasing?: AutoMovieEasing;

  /**
   * Historical swing easing; omission carries the linear interpretation without inserting or evaluating an easing here.
   */
  swingEasing?: AutoMovieEasing;

  /**
   * Historical swing center in degrees, with zero as the omitted interpretation. Storage preserves the supplied offset without resolving a rig's anatomical range or certifying the amplitude against it.
   */
  neutral?: number;
}
