import type { IAutoMovieHumanFaceBasis } from "@automovie/human";

import { faceSupportFaults } from "./faceSupportFaults";

/**
 * Explore one two-sided shape channel's envelope (changing `basis` in place)
 * to cover the caller's reference `interval`, as `prepareLipEnvelopeBasis`
 * describes. Each side follows its sparse endpoint out from unit weight in
 * steps of `step` until its measure passes that direction's interval edge,
 * slows below half the authored rate, becomes unreadable, or reaches `reach`.
 * Candidate extensions back off by steps on `faceSupportFaults` or `guard`
 * faults. Existing limits and the unit endpoint are retained; this processor
 * does not revalidate that existing authored domain.
 *
 * Callers provide an admitted basis, finite positive step and finite reach;
 * its positive endpoint is a string by the basis contract. Positions stay in
 * basis metres and one frame; measure and interval use the same caller-defined
 * signal unit. Callbacks must respect readonly ownership: the neutral measure
 * reads the caller's positions, while candidate reads receive fresh arrays.
 * Only the selected channel's limits are mutated; source positions and sparse
 * target rows stay unchanged.
 * Sampling and the half-rate cutoff are numerical exploration conventions,
 * not physiological admission of all intermediate values or combinations.
 * The changed limits become actual human trait input bounds through the basis
 * consumers and humanFaceBasisWeights. Caller reference intervals, sampled
 * geometric guards and finite channel checks do not establish living-body
 * admission of the complete values and combinations.
 * The caller selects the signal and its reference interval. No population,
 * posture, measurement definition or citation is passed here, so this processor
 * cannot verify that they describe the same anatomical quantity and conditions.
 * The final hundredth-grid floor has a 1e-9 grid-unit allowance for floating
 * roundoff, equivalent to 1e-11 control units; reached records the unrounded
 * candidate signal rather than certifying the rounded interval's anatomy.
 *
 * @evidence contracts/common.md#principled-implementation A two-sided sparse endpoint is evaluated in each direction until its signal reaches the reference edge, slows below half its authored rate or is lost. Faults back the candidate off by the caller's step. Existing limits are preserved and extensions are rounded to a hundredth grid with a documented numerical allowance. Valid basis and exploration controls are preconditions, and this sampled procedure is not continuous anatomical admission.
 * @evidence contracts/common.md#clear-and-simple-design This owner performs channel-domain exploration; the shared faceSupportFaults owner computes geometric changes and callers own signal meaning and any additional guard.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the selected channel and explicit measure/guard callbacks without document or photograph conditions. It mutates only the chosen channel limits as its API states.
 * @evidence contracts/common.md#meaningful-documentation States the exploration, mutation, callback ownership, units, preconditions, rounding and sampled-admission limits.
 * @evidence contracts/modeling.md#parameter-channels The selected basis channel keeps zero at the source positions and separate positive/negative endpoint rows. Its anatomical trait meaning remains with the basis owner; exploration changes only its numerical domain.
 * @evidence contracts/modeling.md#spatial-conventions Positions remain basis metres in one caller frame, channel weights are dimensionless and reached/interval values share the caller's measure unit; no conversion is performed.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This domain processor defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry This domain processor emits no geometric primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries This processor constructs no boundary between parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation This processor owns no displayed part or joint; the prepared basis consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This offline processor edits channel limits, not an input through which a caller sculpts a human form; form inputs remain the fixed basis's channel definitions.
 */
export function extendFaceEnvelope(props: {
  basis: IAutoMovieHumanFaceBasis;
  surface: IAutoMovieHumanFaceBasis["surfaces"][number];
  channel: string;
  measure: (positions: readonly number[]) => number;
  interval: [number, number];
  guard: (positions: readonly number[]) => number;
  step: number;
  reach: number;
}): {
  from: [number, number];
  to: [number, number];
  reached: [number, number];
  faults: [number, number];
} {
  const { surface } = props;
  const channel = props.basis.channels.find((one) => one.id === props.channel);
  if (
    channel === undefined ||
    channel.kind !== "shape" ||
    channel.negative === null
  )
    throw new Error(`No two-sided shape channel ${props.channel}.`);
  const rows = (sign: number) =>
    surface.targets[sign < 0 ? channel.negative! : channel.positive!] ?? [];
  const at = (w: number): number[] => {
    const flat = rows(w);
    const positions = [...surface.positions];
    for (let i = 0; i < flat.length; i += 4)
      for (let k = 0; k < 3; ++k)
        positions[3 * flat[i]! + k]! += Math.abs(w) * flat[i + 1 + k]!;
    return positions;
  };
  const support = new Set<number>();
  for (const sign of [-1, 1]) {
    const flat = rows(sign);
    for (let i = 0; i < flat.length; i += 4) support.add(flat[i]!);
  }
  const triangles: number[] = [];
  for (let t = 0; t < surface.indices.length; t += 3)
    if ([0, 1, 2].some((e) => support.has(surface.indices[t + e]!)))
      triangles.push(t);
  const faults = (positions: readonly number[]) =>
    faceSupportFaults({
      source: surface.positions,
      positions,
      indices: surface.indices,
      triangles,
    }) + props.guard(positions);
  const neutral = props.measure(surface.positions);
  const from: [number, number] = [channel.minimum, channel.maximum];
  // The last valid step below an invalid reach.
  const backOff = (
    sign: -1 | 1,
    reach: number,
    fault: number,
  ): [number, number, number] => {
    let k = 1;
    while (
      reach - k * props.step > 1 &&
      faults(at(sign * (reach - k * props.step))) > 0
    )
      ++k;
    const w = Math.max(1, reach - k * props.step);
    return [w, props.measure(at(sign * w)), fault];
  };
  // Each side: out from the authored end until the measure passes the
  // interval's edge in the direction that side moves it.
  const side = (sign: -1 | 1): [number, number, number] => {
    let previous = 1;
    let read = props.measure(at(sign));
    // The authored rate of the measure per unit of control; a control
    // that does not move its measure, or loses it, means nothing to extend.
    const rate = Math.abs(read - neutral);
    if (!(rate > 0)) return [1, read, 0];
    const rising = read > neutral;
    const edge = rising ? props.interval[1] : props.interval[0];
    const past = (value: number) => (rising ? value >= edge : value <= edge);
    if (past(read)) return [1, read, 0];
    const steps = Math.round((props.reach - 1) / props.step);
    for (let k = 1; k <= steps; ++k) {
      const w = 1 + k * props.step;
      const next = props.measure(at(sign * w));
      // A measure lost (not a number) or slowed to under half its authored
      // rate ends the side.
      if (!(Math.abs(next - read) >= (rate * props.step) / 2)) break;
      if (past(next)) {
        const reach =
          previous + ((edge - read) / (next - read)) * (w - previous);
        const fault = faults(at(sign * reach));
        if (fault === 0) return [reach, edge, 0];
        return backOff(sign, reach, fault);
      }
      [previous, read] = [w, next];
    }
    const fault = faults(at(sign * previous));
    return fault === 0 ? [previous, read, 0] : backOff(sign, previous, fault);
  };
  const [low, lowRead, lowFault] = side(-1);
  const [high, highRead, highFault] = side(1);
  // Hundredths, rounded toward the authored end.
  const to: [number, number] = [
    Math.min(from[0], -Math.floor(low * 100 + 1e-9) / 100),
    Math.max(from[1], Math.floor(high * 100 + 1e-9) / 100),
  ];
  channel.minimum = to[0];
  channel.maximum = to[1];
  return {
    from,
    to,
    reached: [lowRead, highRead],
    faults: [lowFault, highFault],
  };
}
