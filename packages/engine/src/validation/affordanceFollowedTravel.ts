import type { IAutoMovieAffordance } from "@automovie/interface";

/**
 * A follower's travel at its leader's travel, by the rule its `follows` declares: the leader's travel times `ratio`, or the piecewise-linear interpolation of `table`.
 *
 * A leader's travel outside the table's first and last inputs takes the nearer end's output; engine admission requires a table to cover the leader's whole range, so an admitted model never reaches that case.
 *
 * @param follows The follower's rule.
 * @param leader The leader's travel, in its kind's unit.
 * @returns The follower's travel, in its kind's unit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both rules and what lies outside a table.
 * @evidence contracts/development/implementation.md#principled-implementation Multiplication, or linear interpolation between the two table pairs that bracket the input, found by binary search over the strictly increasing inputs engine admission guarantees.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per form; owned here so engine admission's range check and the archetypes' pose evaluate one rule.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Outside the table the end value holds, never an extrapolation; admission keeps admitted models inside.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(log n) in the table's rows.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function affordanceFollowedTravel(
  follows: IAutoMovieAffordance.Follows,
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
  return y0 + ((y1 - y0) * (leader - x0)) / (x1 - x0);
}
