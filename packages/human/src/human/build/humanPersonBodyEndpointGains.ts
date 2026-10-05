import type { humanBodyBasisWeights } from "../../body/basis/humanBodyBasisWeights";
import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";

/**
 * Each body endpoint's gain under a body endpoint state: the weight of the
 * channel side that endpoint belongs to, plus the activation of every
 * corrective that targets it. These are the factors the body applies that
 * endpoint's rows with, so a driver carrying them moves the face view's rows
 * of the same endpoint exactly as far.
 *
 * @evidence contracts/common.md#principled-implementation The gain is read from the state the body builder itself skinned with, never recomputed.
 * @evidence contracts/common.md#clear-and-simple-design One pass over channels and one over activations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero gains are omitted rather than written, so an absent endpoint reads as zero.
 * @evidence contracts/common.md#meaningful-documentation States what a gain is and why drivers read it.
 * @evidence contracts/modeling.md#parameter-channels Maps channel weights and corrective activations onto the endpoints they drive.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Gains are unitless.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The body builder admitted the state.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function adds no input.
 */
export function humanPersonBodyEndpointGains(
  basis: IAutoMovieHumanBodyBasis,
  state: ReturnType<typeof humanBodyBasisWeights>,
): Map<string, number> {
  const gains = new Map<string, number>();
  for (const channel of basis.channels) {
    const weight = state.weights.get(channel.id) ?? 0;
    if (weight !== 0) gains.set(weight < 0 ? channel.negative! : channel.positive, Math.abs(weight));
  }
  for (const one of state.activations)
    if (one.activation > 0) gains.set(one.target, (gains.get(one.target) ?? 0) + one.activation);
  return gains;
}
