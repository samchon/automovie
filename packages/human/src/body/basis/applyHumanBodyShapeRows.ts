import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyShapeRowState } from "../structures/IAutoMovieHumanBodyShapeRowState";
import type { IHumanBodyShapeTargetGain } from "./IHumanBodyShapeTargetGain";

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
 * The complete ordered active-target plan is prepared first. If any target's
 * source is unavailable on this revision, refusal names it before the first
 * buffer write. Zero gain reads no field. An absent availability record
 * preserves legacy behavior without certifying the source or its anatomy.
 */
export function applyHumanBodyShapeRows(
  basis: Pick<IAutoMovieHumanBodyBasis, "channels" | "unavailableTargets">,
  state: IAutoMovieHumanBodyShapeRowState,
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
  const active: IHumanBodyShapeTargetGain[] = [];
  for (const channel of basis.channels) {
    const weight = state.weights.get(channel.id) ?? 0;
    if (weight === 0) continue;
    active.push({
      target: weight < 0 ? channel.negative! : channel.positive,
      gain: Math.abs(weight),
    });
  }
  for (const corrective of state.activations)
    if (corrective.activation > 0)
      active.push({ target: corrective.target, gain: corrective.activation });
  const unavailable = new Set(basis.unavailableTargets ?? []);
  const missing = [
    ...new Set(
      active
        .filter(({ target }) => unavailable.has(target))
        .map(({ target }) => target),
    ),
  ];
  if (missing.length > 0)
    throw new Error(
      "Body source target is unavailable on this revision: " +
        missing.join(", "),
    );
  for (const { target, gain } of active) accumulate(target, gain);
}
