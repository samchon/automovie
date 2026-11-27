import type { IAutoMovieAffordanceCoupling } from "@automovie/interface";

import { interpolateAffordanceTravel } from "./internal/interpolateAffordanceTravel";

/**
 * A follower's travel at its leader's travel, by the rule its `follows`
 * declares: the leader's travel times `ratio`, or the piecewise-linear
 * interpolation of `table`.
 *
 * A leader's travel outside the table's first and last inputs takes the nearer
 * end's output; engine admission requires a table to cover the leader's whole
 * range, so an admitted model never reaches that case. Interior reads reorder
 * the arithmetic when an intermediate width or product loses range.
 *
 * @param follows The follower's rule.
 * @param leader The leader's travel, in its kind's unit.
 * @returns The follower's travel, in its kind's unit.
 */
export function affordanceFollowedTravel(
  follows: IAutoMovieAffordanceCoupling,
  leader: number,
): number {
  if (follows.table === undefined) return follows.ratio * leader;
  const table: [number, number][] = follows.table;
  if (leader <= table[0]![0]) return table[0]![1];
  if (leader >= table[table.length - 1]![0]) return table[table.length - 1]![1];

  // The last row at or before the leader's travel, and the next.
  let low: number = 0;
  let high: number = table.length - 1;
  while (high - low > 1) {
    const middle: number = (low + high) >> 1;
    if (table[middle]![0] <= leader) low = middle;
    else high = middle;
  }
  const [x0, y0]: [number, number] = table[low]!;
  const [x1, y1]: [number, number] = table[high]!;
  if (leader === x0) return y0;
  return interpolateAffordanceTravel(x0, x1, y0, y1, leader);
}
