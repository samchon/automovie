/**
 * Expand sparse `[vertex, dx, dy, dz]` rows to a dense XYZ field over `count`
 * vertices. A row outside the surface refuses instead of being dropped.
 */
export function denseHumanSourceRows(
  rows: readonly number[] | undefined,
  count: number,
): Float64Array {
  if (
    !Number.isSafeInteger(count) ||
    count < 0 ||
    !Number.isSafeInteger(3 * count) ||
    (rows !== undefined && rows.length % 4 !== 0)
  )
    throw new Error(
      "Sparse source rows require a complete quadruple population and safe native count.",
    );
  const out = new Float64Array(3 * count);
  if (rows === undefined) return out;
  for (let i = 0; i < rows.length; i += 4) {
    const v = rows[i];
    if (
      !Number.isSafeInteger(v) ||
      v < 0 ||
      v >= count ||
      !Number.isFinite(rows[i + 1]) ||
      !Number.isFinite(rows[i + 2]) ||
      !Number.isFinite(rows[i + 3])
    )
      throw new Error(
        `Sparse row vertex ${v} or its delta is invalid for the surface.`,
      );
    out[3 * v] = rows[i + 1];
    out[3 * v + 1] = rows[i + 2];
    out[3 * v + 2] = rows[i + 3];
  }
  return out;
}
