import type { IAutoMovieHumanFaceChannelScale } from "../../face/structures/IAutoMovieHumanFaceChannelScale";

/**
 * Select each head-solve channel's source-measured RMS unit-weight displacement scale in metres. Positive/negative weights select that endpoint's scale, an absent negative scale uses positive, and zero uses sqrt((positive²+negative²)/2).
 *
 * The source channel-measurement owner supplies admitted finite scales and aligned weights; this reader refuses missing channel identity but adds no complete input validation. Independent endpoint scales omit cross-effects between channels and do not measure clinical likeness or prove a global least-departure optimum. Inputs remain unchanged and output scales are owned.
 *
 * @evidence contracts/common.md#principled-implementation Actual source RMS endpoint scales select signed-side cost, with the exact two-side quadratic mean at neutral rather than an invented portrait-specific penalty.
 * @evidence contracts/common.md#clear-and-simple-design This selector supplies departure coefficients; source displacement measurement and bounded optimization retain their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source channel scales refuse, while absent negative fallback and omitted cross-effects remain explicit numerical conventions rather than clinical or global-optimum claims.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre RMS scales, dimensionless weight selection, neutral formula and aligned/finite input premises.
 * @evidence contracts/performance.md#efficient-algorithms C requested channels each search S supplied scale records, giving O(C*S) lookup plus fixed arithmetic per result.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each trial's signs select its own scales from the supplied table; this selector owns no cross-trial measurement cache or solver coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the C-sized scale array escapes; source table, weights and callbacks are not retained and no task is acquired.
 */
export function humanPersonHeadDeparture(
  scales: readonly IAutoMovieHumanFaceChannelScale[],
  channels: readonly string[],
  weights: readonly number[],
): number[] {
  return channels.map((id: string, j: number): number => {
    const scale: IAutoMovieHumanFaceChannelScale | undefined = scales.find(
      (one: IAutoMovieHumanFaceChannelScale): boolean => one.id === id,
    );
    if (scale === undefined)
      throw new Error(`The head view measures no channel ${id}.`);
    const positive: number = scale.positive.displacement;
    const negative: number = scale.negative?.displacement ?? positive;
    if (weights[j] > 0) return positive;
    if (weights[j] < 0) return negative;
    return Math.sqrt((positive * positive + negative * negative) / 2);
  });
}
