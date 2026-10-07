/**
 * Bracket a parameter on the seam's already admitted cyclic correspondence.
 * The seam supplies its nearest-face follow parameters after merge has checked
 * their order. Band displacement and face weight lookup use this same face
 * edge coordinate instead of requiring a clipped body contour to be radial.
 * Parameters are dimensionless, normalized modulo the positive face edge count.
 * At an exact sample the last tied resident owns low with fraction zero; the
 * next cyclic sample is high. Inputs are read only and the table is owned.
 * The caller supplies a nonempty ordered population and finite query values.
 *
 * @evidence contracts/common.md#principled-implementation Predecessor search on normalized cyclic parameters finds the unique interval between consecutive distinct samples; the wrap interval extends by one period before affine interpolation.
 * @evidence contracts/common.md#clear-and-simple-design One immutable sorted table and binary predecessor lookup serves both collar consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Correspondence ordering remains the merge owner's strict admission; lookup introduces no angle epsilon or repaired order.
 * @evidence contracts/common.md#meaningful-documentation States admitted input responsibility, coordinate, exact sample ownership, wrap and mutation.
 * @evidence contracts/modeling.md#spatial-conventions Face-edge parameters and interpolation fractions are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authored channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Reads an admitted shared correspondence and constructs no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Owns no displayed form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Defines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits no anatomical input.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no user input.
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
