import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

/**
 * Add a document's channel and corrective rows to one position buffer.
 *
 * For each vertex or landmark p the buffer becomes p + sum(abs(weight) *
 * endpoint) + sum(activation * corrective target), channels first and in the
 * basis's channel order, then the correctives in activation order. A negative
 * weight reads the channel's negative endpoint. A buffer without a row for an
 * endpoint is left where it is. The buffer is changed in place, so the caller
 * owns it and passes a copy of anything it must keep; `targets` and the
 * state are read only. Positions are the basis's metres, three numbers per
 * vertex, and each row is a vertex index followed by its offset in metres.
 * `evaluateHumanBodyShape` and `evaluateHumanBodyLandmarks` share this owner,
 * so the skin and the joints that sit in it move by the same sum.
 */
export function applyHumanBodyShapeRows(
  basis: Pick<IAutoMovieHumanBodyBasis, "channels">,
  state: {
    weights: ReadonlyMap<string, number>;
    activations: readonly { target: string; activation: number }[];
  },
  positions: number[],
  targets: Record<string, number[]>,
): void {
  const accumulate = (name: string, gain: number): void => {
    const rows = targets[name];
    if (rows === undefined) return;
    for (let i = 0; i < rows.length; i += 4)
      for (let axis = 0; axis < 3; axis++)
        positions[rows[i] * 3 + axis] += gain * rows[i + axis + 1];
  };
  for (const channel of basis.channels) {
    const weight = state.weights.get(channel.id) ?? 0;
    if (weight === 0) continue;
    accumulate(weight < 0 ? channel.negative! : channel.positive, Math.abs(weight));
  }
  for (const corrective of state.activations)
    if (corrective.activation > 0)
      accumulate(corrective.target, corrective.activation);
}
