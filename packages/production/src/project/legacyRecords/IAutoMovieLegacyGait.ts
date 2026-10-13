/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { IAutoMovieGaitRootBob } from "@automovie/interface";
import type { IAutoMovieLegacyGaitLimb } from "./IAutoMovieLegacyGaitLimb";

/**
 * JSON-safe gait definition the v1 store performed against, mirroring
 * {@link IAutoMovieGait} minus the tuple-valued bezier controls its limbs cannot
 * express here.
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
