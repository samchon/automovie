import type { IAutoMovieAffordance } from "@automovie/interface";

/**
 * The unique leader travel that gives a requested follower travel.
 *
 * @param follows The coupling, in each articulation's travel unit.
 * @param follower The requested follower travel.
 * @returns The leader travel, or null for a non-finite value, a zero ratio, a malformed or non-monotone table, or a request outside the table's image. This does not grant permission to drive a follower; `reversible` grants that at the state boundary.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the units, the result, every non-invertible case and who grants reverse driving.
 * @evidence contracts/development/implementation.md#principled-implementation Division for a nonzero linear map, or the inverse of a continuous strictly monotone piecewise-linear map, using the same row coordinates as the forward coupling. Strict monotonicity makes the inverse unique; requests outside its image are refused rather than clamped.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the ratio or table, bracket the output, invert that segment.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No extrapolation, root search, fitted approximation or branch chosen for a non-monotone map.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(n) to establish the table's invertibility, then O(log n) to find its segment, with constant extra space; model admission and authored states use small tables.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure calculation with no cross-call state.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function affordanceLeadingTravel(
  follows: IAutoMovieAffordance.Follows,
  follower: number,
): number | null {
  if (!Number.isFinite(follower)) return null;
  if ((follows.ratio === undefined) === (follows.table === undefined)) return null;
  if (follows.table === undefined) {
    if (!Number.isFinite(follows.ratio) || follows.ratio === 0) return null;
    const leader: number = follower / follows.ratio;
    return Number.isFinite(leader) ? leader : null;
  }
  const table: [number, number][] = follows.table;
  if (table.length < 2) return null;
  const first: [number, number] = table[0]!;
  const last: [number, number] = table[table.length - 1]!;
  const direction: number = Math.sign(last[1] - first[1]);
  if (direction === 0) return null;
  for (let k: number = 0; k < table.length; k++) {
    const row: [number, number] = table[k]!;
    if (!Number.isFinite(row[0]) || !Number.isFinite(row[1])) return null;
    if (
      k > 0 &&
      (!(row[0] > table[k - 1]![0]) ||
        !(direction * (row[1] - table[k - 1]![1]) > 0))
    )
      return null;
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
  const leader: number = x0 + ((x1 - x0) * (follower - y0)) / (y1 - y0);
  return Number.isFinite(leader) ? leader : null;
}
