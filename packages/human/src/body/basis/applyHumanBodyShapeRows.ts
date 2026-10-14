import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyShapeRowState } from "../structures/IAutoMovieHumanBodyShapeRowState";
import type { IHumanBodyShapeTargetGain } from "./IHumanBodyShapeTargetGain";

/**
 * Add a document's channel and corrective rows to one position buffer.
 *
 * For each vertex or landmark p the buffer becomes p + sum(abs(weight) * endpoint) + sum(activation * corrective target), channels first and in the basis's channel order, then the correctives in activation order. A negative weight reads the channel's negative endpoint. A buffer without a row for an endpoint is left where it is. The buffer is changed in place, so the caller owns it and passes a copy of anything it must keep; `targets` and the state are read only. Positions are the basis's metres, three numbers per vertex, and each row is a vertex index followed by its offset in metres. `evaluateHumanBodyShape` and `evaluateHumanBodyLandmarks` share this owner, so the skin and the joints that sit in it move by the same sum. The complete ordered active-target plan is prepared first. If any target's source is unavailable on this revision, refusal names it before the first buffer write. Zero gain reads no field. An absent availability record preserves legacy behavior without certifying the source or its anatomy.
 *
 * @evidence contracts/common.md#principled-implementation An ordered active-target plan rejects explicitly unavailable dependencies before in-place sparse displacement accumulation, preserving channel-sign endpoint selection and corrective order.
 * @evidence contracts/common.md#clear-and-simple-design One shared row owner moves skin and joint landmarks by the same authored sum while callers own copied position buffers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing rows on one surface mean no local displacement, not an invented zero source; absent availability metadata preserves legacy behavior without certifying anatomy.
 * @evidence contracts/common.md#meaningful-documentation The prose gives meter row layout, sign/gain semantics, caller mutation ownership and pre-write unavailable-source failure effects.
 * @evidence contracts/performance.md#efficient-algorithms Planning scans C channels/A activations and U unavailable IDs; applying active sparse rows costs O(R) row values with O(C+A+U) temporary planning state.
 * @evidence contracts/performance.md#reuse-equivalent-work Skin and landmarks share the same accumulation owner; one availability set serves the whole active plan before any writes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Plan/set arrays expire after the call and only caller-owned positions are mutated; unavailable failure occurs before that mutation and no task is retained.
 */
export function applyHumanBodyShapeRows(
  basis: Pick<IAutoMovieHumanBodyBasis, "channels" | "unavailableTargets">,
  state: IAutoMovieHumanBodyShapeRowState,
  positions: number[],
  targets: Record<string, number[]>,
): void {
  const accumulate: (name: string, gain: number) => void = (
    name: string,
    gain: number,
  ): void => {
    const rows: number[] | undefined = targets[name];
    if (rows === undefined) return;
    for (let i: number = 0; i < rows.length; i += 4)
      for (let axis: number = 0; axis < 3; axis++)
        positions[rows[i] * 3 + axis] += gain * rows[i + axis + 1];
  };
  const active: IHumanBodyShapeTargetGain[] = [];
  for (const channel of basis.channels) {
    const weight: number = state.weights.get(channel.id) ?? 0;
    if (weight === 0) continue;
    active.push({
      target: weight < 0 ? channel.negative! : channel.positive,
      gain: Math.abs(weight),
    });
  }
  for (const corrective of state.activations)
    if (corrective.activation > 0)
      active.push({ target: corrective.target, gain: corrective.activation });
  const unavailable: Set<string> = new Set(basis.unavailableTargets ?? []);
  const missing: string[] = [
    ...new Set(
      active
        .filter(({ target }: IHumanBodyShapeTargetGain): boolean =>
          unavailable.has(target),
        )
        .map(({ target }: IHumanBodyShapeTargetGain): string => target),
    ),
  ];
  if (missing.length > 0)
    throw new Error(
      "Body source target is unavailable on this revision: " +
        missing.join(", "),
    );
  for (const { target, gain } of active) accumulate(target, gain);
}
