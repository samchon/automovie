import { IAutoMovieGaitLimb } from "./IAutoMovieGaitLimb";
import { IAutoMovieGaitRootBob } from "./IAutoMovieGaitRootBob";
import { IAutoMovieGaitStyle } from "./IAutoMovieGaitStyle";

/**
 * A **declarative gait**: a creature's characteristic locomotion expressed as
 * data, not hand-keyed frames. The same engine synthesiser turns this into a
 * human walk, a horse's lateral-sequence walk, a cat's stalk, or a gallop,
 * differing only in the per-limb **phase offsets**, **duty factor**, and
 * **amplitude**. This is the concrete answer to "every object moves
 * differently": one parameter set per gait, the engine fattening it into
 * per-frame motion ({@link IAutoMovieMotion}). A profile carries a set of
 * these.
 *
 * @author Samchon
 */
export interface IAutoMovieGait {
  /** Stable name (`"walk"`, `"trot"`, `"gallop"`, `"stalk"`). */
  name: string;

  /** Stride period (one full cycle) in seconds. */
  period: number;

  /**
   * Optional vertical root bob for the body mass during the cycle. When
   * present, the gait synthesiser emits a root transform whose `translation.y`
   * follows `center + amplitude * sin(2 * PI * (t / period + phase))`. Omit it
   * for a gait that should leave root placement entirely to `travelMotion` /
   * staging.
   */
  rootBob?: IAutoMovieGaitRootBob;

  /**
   * Optional style scalars that bias the generated gait without changing its
   * footfall sequence. Omit a field to keep the profile's neutral style.
   */
  style?: IAutoMovieGaitStyle;

  /** Each limb's contribution to the cycle. */
  limbs: IAutoMovieGaitLimb[];
}
