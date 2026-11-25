import type {
  IAutoMovieAffordanceCoupling,
  IAutoMovieAffordanceTravelRange,
} from "@automovie/interface";

import { lerp } from "../lerp";
import { affordanceFollowedTravel } from "./affordanceFollowedTravel";

/**
 * The unique leader travel that gives a requested follower travel.
 *
 * @param follows The coupling, in each articulation's travel unit.
 * @param follower The requested follower travel.
 * @param domain The leader's legal range, when known. Its forward images admit
 *   and recover the exact endpoints before inverse arithmetic can round outside
 *   them.
 * @returns The leader travel, or null for a non-finite value, a zero ratio, a
 *   malformed or non-monotone table, or a request outside the table's image.
 *   This does not grant permission to drive a follower; `reversible` grants
 *   that at the state boundary.
 */
export function affordanceLeadingTravel(
  follows: IAutoMovieAffordanceCoupling,
  follower: number,
  domain?: IAutoMovieAffordanceTravelRange.IResult,
): number | null {
  if ((follows.ratio === undefined) === (follows.table === undefined))
    return null;
  if (follows.table === undefined) {
    if (follows.ratio === 0) return null;
    if (domain !== undefined) {
      const end: number | null | undefined = endpoint(
        follows,
        follower,
        domain,
        Math.sign(follows.ratio),
      );
      if (end !== undefined) return end;
    }
    const leader: number = follower / follows.ratio;
    const image: number = affordanceFollowedTravel(follows, leader);
    return Math.abs(image) < Infinity ? leader : null;
  }
  const table: [number, number][] = follows.table;
  if (table.length < 2) return null;
  const first: [number, number] = table[0]!;
  const last: [number, number] = table[table.length - 1]!;
  const direction: number = Math.sign(last[1] - first[1]);
  if (direction === 0) return null;
  for (let k: number = 1; k < table.length; k++) {
    const previous: [number, number] = table[k - 1]!;
    const row: [number, number] = table[k]!;
    const inputSpan: number = usableSpan(previous[0], row[0]);
    const outputSpan: number = direction * usableSpan(previous[1], row[1]);
    if (
      !(
        inputSpan > 0 &&
        inputSpan < Infinity &&
        outputSpan > 0 &&
        outputSpan < Infinity
      )
    )
      return null;
  }
  if (domain !== undefined) {
    const end: number | null | undefined = endpoint(
      follows,
      follower,
      domain,
      direction,
    );
    if (end !== undefined) return end;
  }
  if (
    direction * (follower - first[1]) < 0 ||
    direction * (follower - last[1]) > 0
  )
    return null;
  if (follower === first[1]) return first[0];
  if (follower === last[1]) return last[0];

  // Strictly monotone outputs bracket one segment, even for decreasing maps.
  let low: number = 0;
  let high: number = table.length - 1;
  while (high - low > 1) {
    const middle: number = (low + high) >> 1;
    if (direction * (table[middle]![1] - follower) <= 0) low = middle;
    else high = middle;
  }
  const [x0, y0]: [number, number] = table[low]!;
  const [x1, y1]: [number, number] = table[high]!;
  if (follower === y0) return x0;
  if (follower === y1) return x1;
  const span: number = y1 - y0;
  const distance: number = follower - y0;
  const inputSpan: number = x1 - x0;
  const numerator: number = inputSpan * distance;
  if (Math.abs(numerator) < Infinity && Math.abs(span) < Infinity) {
    const leader: number = x0 + numerator / span;
    return Math.abs(leader) < Infinity ? leader : null;
  }

  // Recover the fraction on a half-scale output segment when its width
  // overflows. The resulting convex combination can span the full input range.
  const fraction: number =
    Math.abs(span) < Infinity
      ? distance / span
      : (follower * 0.5 - y0 * 0.5) / usableSpan(y0, y1);
  if (!(fraction >= 0 && fraction <= 1)) return null;
  return Math.abs(inputSpan) < Infinity
    ? x0 + inputSpan * fraction
    : lerp(x0, x1, fraction);
}

/** A segment's signed width, measured at half scale when subtraction overflows. */
function usableSpan(from: number, to: number): number {
  const width: number = to - from;
  return Math.abs(width) < Infinity ? width : to * 0.5 - from * 0.5;
}

/**
 * Refuse values outside the legal domain's forward image, recover its exact
 * bounds, or leave an interior request to inversion.
 */
function endpoint(
  follows: IAutoMovieAffordanceCoupling,
  follower: number,
  domain: { minimum: number | null; maximum: number | null },
  direction: number,
): number | null | undefined {
  for (const [bound, sign] of [
    [domain.minimum, -1],
    [domain.maximum, 1],
  ] as const) {
    if (bound === null) continue;
    const image: number = affordanceFollowedTravel(follows, bound);
    if (!(Math.abs(image) < Infinity)) return null;
    if (direction * sign * (follower - image) > 0) return null;
    if (follower === image) return bound;
  }
  return undefined;
}
