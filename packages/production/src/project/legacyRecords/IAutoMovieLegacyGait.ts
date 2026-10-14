import type { IAutoMovieGaitRootBob } from "@automovie/interface";
import type { IAutoMovieLegacyGaitLimb } from "./IAutoMovieLegacyGaitLimb";

/**
 * Historical gait metadata preserving period, optional root bob and limb channels without tuple-valued bezier controls. Current resident storage preserves these values without sampling or performing the gait.
 *
 * @evidence contracts/common.md#principled-implementation Historical gait records retain named period, optional root bob and tuple-free limb channels as actor metadata; active runtime gait admission belongs to the engine.
 * @evidence contracts/common.md#clear-and-simple-design LegacyActorContext contains gait records and LegacyGaitLimb owns each channel; current storage preserves these records rather than reimplementing gait synthesis.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This stored schema does not claim a surviving perform protocol or silently manufacture gait defaults.
 * @evidence contracts/common.md#meaningful-documentation States stride seconds, root-bob meaning and relative limb phases.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Cycle metadata samples no phase or limb oscillation; runtime gait owners account for cycle computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A gait name is input identity rather than a completed sampled-motion answer for another actor.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The actor owns the gait limb list and root-bob object and this declaration starts no cyclic task.
 * @author Samchon
 */
export interface IAutoMovieLegacyGait {
  /**
   * Stable name (`"walk"`, `"trot"`, `"gallop"`, `"stalk"`).
   */
  name: string;

  /**
   * Stride period (one full cycle) in seconds.
   */
  period: number;

  /**
   * Optional historical vertical root-bob parameters for center + amplitude * sin(2 * PI * (t / period + phase)). The resident store preserves them without emitting root transforms or filling omitted placement.
   */
  rootBob?: IAutoMovieGaitRootBob;

  /**
   * Historical limb channels describing phase, duty and degree-valued swing. The resident store preserves their order without resolving footfall sequences or generating motion.
   */
  limbs: IAutoMovieLegacyGaitLimb[];
}
