import type { IAutoMovieGaitLimb } from "./IAutoMovieGaitLimb";
import type { IAutoMovieGaitRootBob } from "./IAutoMovieGaitRootBob";

/**
 * A reusable locomotion cycle expressed as timed joint oscillations.
 * `gaitMotion` samples each limb's phase, duty, amplitude and easing into one
 * looping motion; optional rootBob supplies sampled vertical body displacement.
 * Profiles collect named gaits, and binding assigns the target skeleton id
 * without deriving rig-specific joint angles.
 */
export interface IAutoMovieGait {
  /** Stable name (`"walk"`, `"trot"`, `"gallop"`, `"stalk"`). */
  name: string;

  /** Finite positive stride period, one full cycle in seconds. */
  period: number;

  /**
   * Optional vertical root bob for the body mass during the cycle. At each bake
   * sample, the gait synthesiser emits a root transform whose `translation.y`
   * evaluates `center + amplitude * sin(2 * PI * (t / period + phase))` with
   * wrapped cycle phase. Playback linearly interpolates the baked root samples
   * rather than reevaluating the sinusoid. Omit it for a gait that should leave
   * root placement entirely to `travelMotion` / staging.
   */
  rootBob?: IAutoMovieGaitRootBob;

  /** Each limb's contribution to the cycle. */
  limbs: IAutoMovieGaitLimb[];
}
