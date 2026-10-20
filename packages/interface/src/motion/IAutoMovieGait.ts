import { IAutoMovieGaitLimb } from "./IAutoMovieGaitLimb";
import { IAutoMovieGaitRootBob } from "./IAutoMovieGaitRootBob";

/**
 * A reusable locomotion cycle expressed as timed joint oscillations. `gaitMotion` samples each limb's phase, duty, amplitude and easing into one looping motion; optional rootBob supplies sampled vertical body displacement. Profiles collect named gaits, and binding assigns the target skeleton id without deriving rig-specific joint angles.
 *
 * @evidence contracts/common.md#principled-implementation One positive finite period drives every phase-shifted limb oscillation and optional root sinusoid; gaitMotion emits a closing sample matching the start and records cycle provenance for continuous beat handoff.
 * @evidence contracts/common.md#clear-and-simple-design Name and period surround the limb list and optional rootBob; each limb owns its axis and phase behavior, while gait binding owns the target rig and travel owns horizontal movement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Creature labels do not select motion branches, and no unread style hints promise crouch or weight behavior; sampled joint oscillations and optional root bob do not establish planted-foot contact, balance or rig-specific ROM compliance.
 * @evidence contracts/common.md#meaningful-documentation Describes loop synthesis, profile collection and target binding, stride seconds, per-limb ownership, and the exact vertical bob formula with unauthored root on omission.
 */
export interface IAutoMovieGait {
  /** Stable name (`"walk"`, `"trot"`, `"gallop"`, `"stalk"`). */
  name: string;

  /** Finite positive stride period, one full cycle in seconds. */
  period: number;

  /**
   * Optional vertical root bob for the body mass during the cycle. At each bake sample, the gait synthesiser emits a root transform whose `translation.y` evaluates `center + amplitude * sin(2 * PI * (t / period + phase))` with wrapped cycle phase. Playback linearly interpolates the baked root samples rather than reevaluating the sinusoid. Omit it for a gait that should leave root placement entirely to `travelMotion` / staging.
   */
  rootBob?: IAutoMovieGaitRootBob;

  /** Each limb's contribution to the cycle. */
  limbs: IAutoMovieGaitLimb[];
}
