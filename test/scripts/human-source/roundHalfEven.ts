/**
 * NumPy's `round(value, decimals)`: scale by `10 ** decimals`, round half to
 * even, divide back. The published bases stored their sparse rows through
 * this exact sequence (body rows at 6 decimals, weights at 7), so replaying a
 * row compares like with like instead of through a second rounding rule.
 */
export function roundHalfEven(value: number, decimals: number): number {
  const scale = 10 ** decimals;
  const scaled = value * scale;
  const floor = Math.floor(scaled);
  const fraction = scaled - floor;
  const rounded = fraction > 0.5 ? floor + 1 : fraction < 0.5 ? floor : floor % 2 === 0 ? floor : floor + 1;
  const result = rounded / scale;
  return result === 0 ? 0 : result;
}
