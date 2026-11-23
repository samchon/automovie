import type {
  IAutoMovieMotionHumanBreath,
  IAutoMovieMotionHumanLayer,
} from "@automovie/interface";

import { HumanBreath } from "./HumanBreath";

/**
 * The breathing layer: the chest, the upper chest and the lumbar spine extend
 * and the shoulder girdles rise a little with each inhalation, by
 * {@link HumanBreath.layer}.
 *
 * @param params The rate and the exertion bouts; the defaults when absent.
 * @returns The layer that breathes.
 * @evidence contracts/development/design.md#principled-representation The rates, amplitudes and sources are `HumanBreath`'s; this reader only names its parameter.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader, `AutoMovieMotionHumanExpression.breath`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the option type `IAutoMovieMotionHumanBreath` owns.
 */
export function expressionBreath(
  params: IAutoMovieMotionHumanBreath.IOptions = {},
): IAutoMovieMotionHumanLayer {
  return HumanBreath.layer(params);
}
