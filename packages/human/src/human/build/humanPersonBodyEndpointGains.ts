import type { humanBodyBasisWeights } from "../../body/basis/humanBodyBasisWeights";
import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";

/**
 * Each body endpoint's gain under a body endpoint state: the weight of the
 * channel side that endpoint belongs to, plus the activation of every
 * corrective that targets it. These are the factors the body applies that
 * endpoint's rows with, so a driver carrying them moves the face view's rows
 * of the same endpoint exactly as far.
 */
export function humanPersonBodyEndpointGains(
  basis: IAutoMovieHumanBodyBasis,
  state: ReturnType<typeof humanBodyBasisWeights>,
): Map<string, number> {
  const gains = new Map<string, number>();
  for (const channel of basis.channels) {
    const weight = state.weights.get(channel.id) ?? 0;
    if (weight !== 0)
      gains.set(
        weight < 0 ? channel.negative! : channel.positive,
        Math.abs(weight),
      );
  }
  for (const one of state.activations)
    if (one.activation > 0)
      gains.set(one.target, (gains.get(one.target) ?? 0) + one.activation);
  return gains;
}
