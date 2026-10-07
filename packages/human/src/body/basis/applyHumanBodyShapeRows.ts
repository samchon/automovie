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
 *
 * @evidence contracts/common.md#principled-implementation The deformation is the additive blend-shape sum p + sum(abs(weight) * endpoint) + sum(activation * target). Each row stores a vertex index and an offset, so the sum touches only the vertices a row names. abs() is right because a negative weight selects the negative endpoint, whose offset is already authored in that side's direction. Float addition is not associative, so the order (channels in basis order, then correctives in activation order) is fixed and the result is deterministic. A zero weight adds nothing and skips its rows. The precondition is an admitted weight: admission requires a negative endpoint wherever a channel's minimum is below zero, so the non-null assertion on the negative endpoint holds.
 * @evidence contracts/common.md#clear-and-simple-design One ordered active-target plan selects the endpoints and gains, the complete plan is checked for unavailable source dependencies, then the one accumulate closure applies it to the owned buffer; skin and landmark evaluators share this owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable source targets refuse by their declared dependency state before mutation rather than treating omitted new rows as zero. The source publisher owns that state; neither a fixture nor a numerical tolerance selects it.
 * @evidence contracts/common.md#meaningful-documentation States the formula, the application order, the in-place ownership of the buffer, the read-only inputs, the units and the row layout.
 * @evidence contracts/modeling.md#spatial-conventions Positions and offsets are the basis metres in the builder frame, three numbers per vertex; no conversion happens here.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines and groups no part; it adds offsets to a buffer the caller owns.
 * @evidenceExclude contracts/modeling.md#parameter-channels It consumes channels the basis defines and admission checked; it defines none and varies no trait of its own.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no primitive; the buffer keeps the count the caller gave it.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint; the body builder owns the emitted form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value, range or constant; the rows it adds were solved elsewhere.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission of weights belongs to humanBodyBasisWeights; this function adds the rows it is handed.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It defines no caller input; the weights it reads are admitted named channels.
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
