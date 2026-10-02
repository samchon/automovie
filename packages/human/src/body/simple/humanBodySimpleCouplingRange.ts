import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

/**
 * Admissible scalar offsets from the current shape along one solve direction.
 *
 * A basis envelope bounds the absolute channel weight w. The coupled solve's
 * scalar t is an offset, so min <= w + c*t <= max gives two endpoints
 * (min-w)/c and (max-w)/c, reversed when c is negative. Intersect every
 * component's interval. Using the absolute envelope for t would miss inward
 * motion from a shaped endpoint and shorten the reachable opposite endpoint.
 *
 * The expansion supplies admitted finite channel values and coefficients;
 * omitted shape weights are neutral zero. A missing channel throws. A zero
 * direction or fixed intersection returns null because no derivative can be
 * sampled. Inputs are read only; this changes no anatomical envelope.
 *
 * @evidence contracts/common.md#principled-implementation Solving each linear channel inequality for the scalar and intersecting the intervals admits exactly the offsets whose channel weights remain inside every basis envelope, including negative coefficients.
 * @evidence contracts/common.md#clear-and-simple-design One pure owner converts absolute channel bounds to a scalar offset interval; body reading and Newton steps remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bounds come from the actual basis and current shape, with no extra envelope or person-specific constant.
 * @evidence contracts/common.md#meaningful-documentation States the linear inequality, offset convention, sign reversal, admitted-input premise, absent weight and derivative refusal cases.
 * @evidence contracts/modeling.md#spatial-conventions Channel values, coefficients and offsets are dimensionless basis scalars; no body coordinate frame is converted.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It owns no part or group.
 * @evidence contracts/modeling.md#parameter-channels It consumes each named channel's current weight and existing envelope. Omitted weight zero is the basis neutral, while scalar offset zero means no change to that current weight. Positive scalar motion follows the coefficient's sign; negative coefficients reverse the interval endpoints. Intersecting all component bounds handles a direction spanning several channels, and left/right identities are addressed separately rather than mirrored by name. The existing basis owns each trait's meaning and dependencies; this range conversion does not prove their physiological independence.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis owns the channel envelopes; this owner carries no anatomical constant.
 * @evidenceExclude contracts/anatomy.md#permitted-range These are numerical offset bounds over existing admitted channels, not a new physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The expansion derives the direction from named measurements; this is internal solver state rather than a document control.
 */
export function humanBodySimpleCouplingRange(
  channels: readonly Pick<IAutoMovieHumanBodyBasis["channels"][number], "id" | "minimum" | "maximum">[],
  shape: Readonly<Record<string, number>>,
  direction: readonly { channel: string; coefficient: number }[],
): [number, number] | null {
  let minimum = -Infinity;
  let maximum = Infinity;
  for (const component of direction) {
    if (component.coefficient === 0) continue;
    const channel = channels.find((one) => one.id === component.channel);
    if (channel === undefined) throw new Error("A coupled solve needs channel " + component.channel + ".");
    const value = shape[component.channel] ?? 0;
    const first = (channel.minimum - value) / component.coefficient;
    const second = (channel.maximum - value) / component.coefficient;
    minimum = Math.max(minimum, Math.min(first, second));
    maximum = Math.min(maximum, Math.max(first, second));
  }
  return Number.isFinite(minimum) && Number.isFinite(maximum) && minimum < maximum
    ? [minimum, maximum] : null;
}
