import type { IAutoMovieAffordanceCoupling } from "@automovie/interface";

import { interpolateAffordanceTravel } from "./interpolateAffordanceTravel";

/*
 * A follower's travel at its leader's travel, by the rule its `follows`
 * declares: the leader's travel times `ratio`, or the piecewise-linear
 * interpolation of `table`.
 *
 * A leader's travel outside the table's first and last inputs takes the nearer
 * end's output; engine admission requires a table to cover the leader's whole
 * range, so an admitted model never reaches that case. Interior reads reorder
 * the arithmetic when an intermediate width or product loses range.
 * Parameter follows: The follower's rule.
 * Parameter leader: The leader's travel, in its kind's unit.
 * Returns: The follower's travel, in its kind's unit.
 */
export function affordanceFollowedTravel(
  follows: IAutoMovieAffordanceCoupling,
  leader: number,
): number {
  if (follows.table === undefined) return follows.ratio * leader;
  const table: IAutoMovieAffordanceCoupling.IPoint[] = follows.table;
  if (leader <= table[0]!.leader) return table[0]!.follower;
  if (leader >= table[table.length - 1]!.leader) return table[table.length - 1]!.follower;

  // The last row at or before the leader's travel, and the next.
  let low: number = 0;
  let high: number = table.length - 1;
  while (high - low > 1) {
    const middle: number = (low + high) >> 1;
    if (table[middle]!.leader <= leader) low = middle;
    else high = middle;
  }
  const { leader: x0, follower: y0 } = table[low]!;
  const { leader: x1, follower: y1 } = table[high]!;
  if (leader === x0) return y0;
  return interpolateAffordanceTravel(x0, x1, y0, y1, leader);
}
