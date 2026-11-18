import { bracketedRoot } from "./bracketedRoot";

/**
 * Close a bracket onto the place where a continuous reading crosses from one
 * side of a threshold to the other, keeping which end lies on which side: the
 * lower end is never past the threshold and the upper end always is, as a
 * bisection keeps them, at a final width no greater than the one asked.
 *
 * The reading is first driven by the Illinois false position
 * (`bracketedRoot`), each of whose readings is inside the bracket and moves
 * the end of its own side exactly as a bisection's reading does. Whatever
 * width that leaves (a reading of exactly zero ends it at once; a reading
 * that is not finite is never handed to it) is then bisected away, so the
 * final width is the caller's whatever the reading does. A caller that asks
 * the width a number of bisections would leave therefore gets a crossing at
 * least as fine as theirs, in fewer readings where the reading is smooth.
 *
 * @param props The reading less its threshold (`f`, positive on one side); which sign is past the threshold (`past`); the bracket's two ends, `low` not past and `high` past; their readings when the caller has them (`known`), so they are not read again; and the final width, positive.
 * @returns The final bracket: `low`, the greatest argument read that is not past the threshold, and `high`, the least read that is.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is kept on each side, the two stages and why the final width is guaranteed, every input's meaning and the result.
 * @evidence contracts/development/implementation.md#principled-implementation Dowell and Jarratt's Illinois false position on a continuous reading, whose sign test keeps the crossing inside the bracket, completed by bisection, which halves any bracket whatever the reading. The premise for the crossing's uniqueness, a reading that crosses once in the bracket, is the caller's, as it is for a bisection.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One side test shared by both stages; the root search and the halving each own one loop.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No reading is assumed: both ends' sides are the caller's actual readings, a reading that is not a number falls on the side the caller's test gives it, and the width is met by halving, never declared.
 * @evidence contracts/development/implementation.md#efficient-algorithms One reading a step at superlinear order on a smooth reading, bounded by the root search's limit plus the halvings the remaining width needs.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure search; the caller's known end readings are the only values shared.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds four numbers for the call and retains nothing.
 */
export function bracketedCrossing(props: {
  f: (x: number) => number;
  past: (value: number) => boolean;
  low: number;
  high: number;
  known?: { low: number; high: number };
  tolerance: number;
}): { low: number; high: number } {
  let low: number = props.low;
  let high: number = props.high;
  const read = (x: number): number => {
    const value: number =
      props.known !== undefined && x === props.low
        ? props.known.low
        : props.known !== undefined && x === props.high
          ? props.known.high
          : props.f(x);
    if (x > low && x < high) {
      if (props.past(value)) high = x;
      else low = x;
    }
    return value;
  };
  const first: number = read(props.low);
  const last: number = read(props.high);
  if (
    Number.isFinite(first) &&
    Number.isFinite(last) &&
    first !== 0 &&
    last !== 0 &&
    first > 0 !== last > 0 &&
    props.tolerance > 0 &&
    Number.isFinite(props.tolerance)
  )
    bracketedRoot(
      (x: number): number =>
        x === props.low ? first : x === props.high ? last : read(x),
      props.low,
      props.high,
      props.tolerance,
    );
  while (high - low > props.tolerance) {
    const mid: number = (low + high) / 2;
    if (!(mid > low && mid < high)) break;
    read(mid);
  }
  return { low, high };
}
