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
 */
export function humanBodySimpleCouplingRange(
  channels: readonly Pick<
    IAutoMovieHumanBodyBasis["channels"][number],
    "id" | "minimum" | "maximum"
  >[],
  shape: Readonly<Record<string, number>>,
  direction: readonly { channel: string; coefficient: number }[],
): [number, number] | null {
  let minimum = -Infinity;
  let maximum = Infinity;
  for (const component of direction) {
    if (component.coefficient === 0) continue;
    const channel = channels.find((one) => one.id === component.channel);
    if (channel === undefined)
      throw new Error(
        "A coupled solve needs channel " + component.channel + ".",
      );
    const value = shape[component.channel] ?? 0;
    const first = (channel.minimum - value) / component.coefficient;
    const second = (channel.maximum - value) / component.coefficient;
    minimum = Math.max(minimum, Math.min(first, second));
    maximum = Math.min(maximum, Math.max(first, second));
  }
  return Number.isFinite(minimum) &&
    Number.isFinite(maximum) &&
    minimum < maximum
    ? [minimum, maximum]
    : null;
}
