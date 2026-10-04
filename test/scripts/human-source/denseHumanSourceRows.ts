/**
 * Expand sparse `[vertex, dx, dy, dz]` rows to a dense XYZ field over `count`
 * vertices. A row outside the surface refuses instead of being dropped.
 */
export function denseHumanSourceRows(rows: readonly number[] | undefined, count: number): Float64Array {
  const out = new Float64Array(3 * count);
  if (rows === undefined) return out;
  for (let i = 0; i < rows.length; i += 4) {
    const v = rows[i];
    if (!(v >= 0 && v < count)) throw new Error(`Sparse row vertex ${v} is outside the surface.`);
    out[3 * v] = rows[i + 1];
    out[3 * v + 1] = rows[i + 2];
    out[3 * v + 2] = rows[i + 3];
  }
  return out;
}
