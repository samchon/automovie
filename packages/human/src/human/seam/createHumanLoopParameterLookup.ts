/**
 * Bracket an already-admitted seam correspondence parameter modulo its positive face-edge count. Band displacement and face weight lookup share this dimensionless coordinate without requiring the clipped body contour to be radial. Caller supplies a nonempty finite ordered population, positive finite period and finite query; this lookup does not enforce those premises. An exact sample selects the last tied low resident and next cyclic high. The normalized sorted table is owned and inputs remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Actual captured nearest-face follow coordinates determine cyclic interpolation rather than a second radial projection of the body contour.
 * @evidence contracts/common.md#clear-and-simple-design Normalize/sort once, then use one binary bracket with original resident indices; correspondence order admission remains with seam merging.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source identity or anatomical validity is inferred from parameter order, and nonempty/finite/positive-period premises are stated rather than falsely claimed checked here.
 * @evidence contracts/common.md#meaningful-documentation Prose states dimensionless face-edge period, tied low selection, cyclic high and input/table ownership.
 * @evidence contracts/performance.md#efficient-algorithms N normalized records sort in O(N log N), then each finite query uses fixed modulo arithmetic and O(log N) binary search.
 * @evidence contracts/performance.md#reuse-equivalent-work The same owned normalized order serves every current band/weight lookup without sorting per evaluated vertex.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One N-sized table remains in the returned closure, with no borrowed input array, task, source geometry or render resource retained.
 */
export function createHumanLoopParameterLookup(
  parameters: readonly number[],
  period: number,
): (value: number) => { low: number; high: number; along: number } {
  const normalize: (value: number) => number = (value: number): number => {
    const remainder: number = value % period;
    return remainder < 0 ? remainder + period : remainder;
  };
  const table: { value: number; index: number }[] = parameters
    .map((value: number, index: number): { value: number; index: number } => ({
      value: normalize(value),
      index,
    }))
    .sort(
      (
        a: { value: number; index: number },
        b: { value: number; index: number },
      ): number => a.value - b.value,
    );
  return (value: number): { low: number; high: number; along: number } => {
    const at: number = normalize(value);
    let low: number = 0;
    let high: number = table.length - 1;
    if (at < table[0].value) low = high;
    else
      while (low < high) {
        const middle: number = (low + high + 1) >> 1;
        if (table[middle].value <= at) low = middle;
        else high = middle - 1;
      }
    const next: number = (low + 1) % table.length;
    const start: number = table[low].value;
    const end: number = table[next].value + (next === 0 ? period : 0);
    const target: number = at + (at < start ? period : 0);
    return {
      low: table[low].index,
      high: table[next].index,
      along: (target - start) / (end - start),
    };
  };
}
