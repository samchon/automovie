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
 *
 * @evidence contracts/common.md#principled-implementation Departure is priced by the skin each channel moves, read from the basis, so no channel weight is preferred by an authored number.
 * @evidence contracts/common.md#clear-and-simple-design One lookup per channel and one side choice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A channel the basis does not measure refuses by name; no default scale stands in.
 * @evidence contracts/common.md#meaningful-documentation States the scale, its side rule, the zero convention and what it leaves out.
 * @evidence contracts/modeling.md#spatial-conventions Scales are metres of skin displacement per unit weight.
 * @evidence contracts/modeling.md#parameter-channels Prices each channel by its own measured effect.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function is not displayed; the solved person is observed on the viewer.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The scale is a geometric measure of the basis, not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
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
