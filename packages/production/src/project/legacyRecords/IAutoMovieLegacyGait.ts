import type { IAutoMovieGaitRootBob } from "@automovie/interface";
import type { IAutoMovieLegacyGaitLimb } from "./IAutoMovieLegacyGaitLimb";

/**
 * JSON-safe gait definition the v1 store performed against, mirroring
 * {@link IAutoMovieGait} minus the tuple-valued bezier controls its limbs cannot
 * express here.
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
   * Optional vertical root bob for the body mass during the cycle. When
   * present, the synthesiser emits a root transform whose `translation.y`
   * follows `center + amplitude * sin(2 * PI * (t / period + phase))`. Omit it
   * to leave root placement entirely to travel/staging.
   */
  rootBob?: IAutoMovieGaitRootBob;

  /**
   * Each limb's contribution to the cycle. The limbs differ only in **when**
   * they swing (`phase`) and **how**: a horse walk is its four legs at phase
   * offsets `0, 0.5, 0.25, 0.75` (lateral sequence), a trot at `0, 0.5, 0.5, 0`
   * (diagonal pairs).
   */
  limbs: IAutoMovieLegacyGaitLimb[];
}
