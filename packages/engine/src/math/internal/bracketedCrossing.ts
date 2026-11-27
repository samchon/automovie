import { bracketedRoot } from "./bracketedRoot";

/*
 * Close a bracket onto the place where a continuous reading crosses from one
 * side of a threshold to the other, keeping which end lies on which side: the
 * lower end is never past the threshold and the upper end always is, as a
 * bisection keeps them, at a final width no greater than the one asked.
 *
 * The reading is first driven by the Illinois false position (`bracketedRoot`),
 * each of whose readings is inside the bracket and moves the end of its own
 * side exactly as a bisection's reading does. Whatever width that leaves (a
 * reading of exactly zero ends it at once; a reading that is not finite is
 * never handed to it) is then bisected away, so the final width is the caller's
 * whatever the reading does. A caller that asks the width a number of
 * bisections would leave therefore gets a crossing at least as fine as theirs,
 * in fewer readings where the reading is smooth.
 * Parameter props: The reading less its threshold (`f`, positive on one side);
 * which sign is past the threshold (`past`); the bracket's two ends, `low`
 * not past and `high` past; their readings when the caller has them
 * (`known`), so they are not read again; and the final width, positive.
 * Returns: The final bracket: `low`, the greatest argument read that is not
 * past the threshold, and `high`, the least read that is.
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
    first !== 0 &&
    last !== 0 &&
    first > 0 !== last > 0 &&
    props.tolerance > 0
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
