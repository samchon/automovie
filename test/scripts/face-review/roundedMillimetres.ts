/**
 * Metres as millimetres rounded to the micrometre (three decimals), the unit
 * every basis preparation receipt reports a distance in. A value is rounded
 * for the receipt only; no geometry is computed from the rounded number.
 */
export function roundedMillimetres(metres: number): number {
  return Math.round(metres * 1e6) / 1e3;
}
