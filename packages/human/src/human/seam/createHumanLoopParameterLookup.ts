/**
 * Bracket a parameter on the seam's already admitted cyclic correspondence.
 * The seam supplies its nearest-face follow parameters after merge has checked
 * their order. Band displacement and face weight lookup use this same face
 * edge coordinate instead of requiring a clipped body contour to be radial.
 * Parameters are dimensionless, normalized modulo the positive face edge count.
 * At an exact sample the last tied resident owns low with fraction zero; the
 * next cyclic sample is high. Inputs are read only and the table is owned.
 * The caller supplies a nonempty ordered population and finite query values.
 */
export function createHumanLoopParameterLookup(
  parameters: readonly number[],
  period: number,
): (value: number) => { low: number; high: number; along: number } {
  const normalize = (value: number): number => {
    const remainder = value % period;
    return remainder < 0 ? remainder + period : remainder;
  };
  const table = parameters
    .map((value, index) => ({ value: normalize(value), index }))
    .sort((a, b) => a.value - b.value);
  return (value) => {
    const at = normalize(value);
    let low = 0;
    let high = table.length - 1;
    if (at < table[0].value) low = high;
    else
      while (low < high) {
        const middle = (low + high + 1) >> 1;
        if (table[middle].value <= at) low = middle;
        else high = middle - 1;
      }
    const next = (low + 1) % table.length;
    const start = table[low].value;
    const end = table[next].value + (next === 0 ? period : 0);
    const target = at + (at < start ? period : 0);
    return {
      low: table[low].index,
      high: table[next].index,
      along: (target - start) / (end - start),
    };
  };
}
