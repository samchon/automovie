import type {
  IAutoMovieAffordanceCoupling,
  IAutoMovieAffordanceTravelRange,
} from "@automovie/interface";

import { affordanceFollowedTravel } from "./affordanceFollowedTravel";
import { interpolateAffordanceTravel } from "./interpolateAffordanceTravel";

/*
 * The unique leader travel that gives a requested follower travel.
 * Parameter follows: The coupling, in each articulation's travel unit.
 * Parameter follower: The requested follower travel.
 * Parameter domain: The leader's legal range, when known. Its forward images admit
 * and recover the exact endpoints before inverse arithmetic can round outside
 * them.
 * Returns: The leader travel, or null for a non-finite value, a zero ratio, a
 * malformed or non-monotone table, or a request outside the table's image.
 * This does not grant permission to drive a follower; `reversible` grants
 * that at the state boundary.
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
  const table: IAutoMovieAffordanceCoupling.IPoint[] = follows.table;
  if (table.length < 2) return null;
  const first = table[0]!;
  const last = table[table.length - 1]!;
  const direction: number = Math.sign(last.follower - first.follower);
  if (direction === 0) return null;
  for (let k: number = 1; k < table.length; k++) {
    const previous = table[k - 1]!;
    const row = table[k]!;
    const inputSpan: number = usableSpan(previous.leader, row.leader);
    const outputSpan: number = direction * usableSpan(previous.follower, row.follower);
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
    direction * (follower - first.follower) < 0 ||
    direction * (follower - last.follower) > 0
  )
    return null;
  if (follower === first.follower) return first.leader;
  if (follower === last.follower) return last.leader;

  // Strictly monotone outputs bracket one segment, even for decreasing maps.
  let low: number = 0;
  let high: number = table.length - 1;
  while (high - low > 1) {
    const middle: number = (low + high) >> 1;
    if (direction * (table[middle]!.follower - follower) <= 0) low = middle;
    else high = middle;
  }
  const { leader: x0, follower: y0 } = table[low]!;
  const { leader: x1, follower: y1 } = table[high]!;
  if (follower === y0) return x0;
  if (follower === y1) return x1;
  const leader: number = interpolateAffordanceTravel(y0, y1, x0, x1, follower);
  return Math.abs(leader) < Infinity ? leader : null;
}

/*
 * A segment's signed width, measured at half scale when subtraction overflows.
 */
function usableSpan(from: number, to: number): number {
  const width: number = to - from;
  return Math.abs(width) < Infinity ? width : to * 0.5 - from * 0.5;
}

/*
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
