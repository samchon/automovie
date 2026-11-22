import type {
  IAutoMovieMotionHumanExpression,
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the layer adds, its parameter and its return.
 * @evidence contracts/development/design.md#principled-representation The rates, amplitudes and sources are `HumanBreath`'s; this reader only names its parameter.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader, `AutoMovieMotionHumanExpression.breath`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the option type `IAutoMovieMotionHumanBreath` owns.
 * @evidence contracts/development/implementation.md#principled-implementation Delegates to `HumanBreath.layer`, which owns the law.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegating call.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no value of its own.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work over the call it delegates.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the layer builder with every caller of `HumanBreath.layer`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned layer closes over its options only.
 */
export function expressionBreath(
  params: IAutoMovieMotionHumanExpression.IBreath = {},
): IAutoMovieMotionHumanLayer {
  return HumanBreath.layer(params);
}
