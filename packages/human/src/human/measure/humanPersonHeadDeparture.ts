import type { IAutoMovieHumanFaceChannelScale } from "../../face/structures/IAutoMovieHumanFaceChannelScale";

/**
 * The departure scale of each head solve channel at given weights: the root
 * mean square skin displacement its endpoint moves at unit weight
 * (`measureHumanFaceBasisChannels`), so a weight times its scale is the
 * metres of skin that channel moves on its own.
 *
 * The scale belongs to the side the weight lies on: the positive endpoint's
 * for a positive weight, the negative endpoint's for a negative one. At zero
 * both sides are possible and the scale is the root mean square of the two,
 * the same displacement measure averaged in square over the channel's two
 * endpoints. This is the convention by which "least departure from the
 * standard head" is measured; it reads the basis and holds no number of its
 * own. A channel's cross-effects on another's displacement are not counted.
 */
export function humanPersonHeadDeparture(
  scales: readonly IAutoMovieHumanFaceChannelScale[],
  channels: readonly string[],
  weights: readonly number[],
): number[] {
  return channels.map((id, j) => {
    const scale = scales.find((one) => one.id === id);
    if (scale === undefined)
      throw new Error(`The head view measures no channel ${id}.`);
    const positive = scale.positive.displacement;
    const negative = scale.negative?.displacement ?? positive;
    if (weights[j] > 0) return positive;
    if (weights[j] < 0) return negative;
    return Math.sqrt((positive * positive + negative * negative) / 2);
  });
}
