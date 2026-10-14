import type { humanBodyBasisWeights } from "../../body/basis/humanBodyBasisWeights";
import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";

/**
 * Project a body's endpoint state into the gain map used by registered face drivers. Each nonzero channel sets its selected endpoint's absolute weight; positive corrective activations add to that endpoint. Repeated channel endpoint names overwrite earlier channel entries, so unique endpoint ownership remains a source premise. Gains are dimensionless coefficients, not measured motion amplitudes.
 *
 * @evidence contracts/common.md#principled-implementation Signed channel sides and actual positive corrective activations supply the same endpoint coefficients consumed by the body row owner.
 * @evidence contracts/common.md#clear-and-simple-design This map projection supplies gains only; endpoint-state evaluation and face driver/channel registration retain their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted weights read zero and inactive correctives contribute nothing; unique source endpoint ownership is a premise rather than silently claimed aggregation across repeated channels.
 * @evidence contracts/common.md#meaningful-documentation Prose states set-versus-add semantics, source uniqueness and dimensionless gain meaning.
 * @evidence contracts/performance.md#efficient-algorithms One channel pass and one activation pass build a map proportional to encountered active endpoint identities.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This projection reflects one actual state and owns no cache across changed channel weights or activations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned scalar map belongs to the caller; the routine retains no basis/state arrays, task or resource.
 */
export function humanPersonBodyEndpointGains(
  basis: IAutoMovieHumanBodyBasis,
  state: ReturnType<typeof humanBodyBasisWeights>,
): Map<string, number> {
  const gains: Map<string, number> = new Map<string, number>();
  for (const channel of basis.channels) {
    const weight: number = state.weights.get(channel.id) ?? 0;
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
