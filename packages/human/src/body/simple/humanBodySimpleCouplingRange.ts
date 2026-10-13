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
 * @evidence contracts/common.md#principled-implementation Intersect the scalar preimages of each absolute channel envelope, reversing endpoints for negative coefficients and omitting zero components; finite admitted inputs are required.
 * @evidence contracts/common.md#clear-and-simple-design Interval arithmetic stays separate from direction construction and solve iteration, so the current shape's offset origin remains explicit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing channels throw; empty, fixed or unbounded intersections return null instead of widening support or treating absolute weights as offsets.
 * @evidence contracts/common.md#meaningful-documentation The comment states the affine inequality, zero neutral, coefficient sign, refusal cases and read-only inputs; the result is the scalar offset interval.
 * @evidence contracts/performance.md#efficient-algorithms D direction components each search C channels, costing O(D*C) time and constant workspace; current directions and the basis table are small and no geometry is evaluated.
 * @evidence contracts/performance.md#reuse-equivalent-work No cross-call range is reused because the current weights change the offset interval; supplied channel envelopes remain borrowed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call owns two bounds and at most one returned pair; it retains no basis, buffers, handles or tasks after completion.
 */
export function humanBodySimpleCouplingRange(
  channels: readonly Pick<
    IAutoMovieHumanBodyBasis["channels"][number],
    "id" | "minimum" | "maximum"
  >[],
  shape: Readonly<Record<string, number>>,
  direction: readonly { channel: string; coefficient: number }[],
): [number, number] | null {
  let minimum: number = -Infinity;
  let maximum: number = Infinity;
  for (const component of direction) {
    if (component.coefficient === 0) continue;
    const channel: (typeof channels)[number] | undefined = channels.find((one: (typeof channels)[number]): boolean => one.id === component.channel);
    if (channel === undefined)
      throw new Error(
        "A coupled solve needs channel " + component.channel + ".",
      );
    const value: number = shape[component.channel] ?? 0;
    const first: number = (channel.minimum - value) / component.coefficient;
    const second: number = (channel.maximum - value) / component.coefficient;
    minimum = Math.max(minimum, Math.min(first, second));
    maximum = Math.min(maximum, Math.max(first, second));
  }
  return Number.isFinite(minimum) &&
    Number.isFinite(maximum) &&
    minimum < maximum
    ? [minimum, maximum]
    : null;
}
