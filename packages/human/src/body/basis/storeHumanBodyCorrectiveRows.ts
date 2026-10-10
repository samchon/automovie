/**
 * Store admitted corrective displacement rows on the publication convention's
 * ten-micrometre grid, returning an independently owned sparse-row array.
 *
 * Rows are [vertex, dx, dy, dz] in the caller's unchanged metre frame. Vertex
 * identities remain exact; displacement ties use JavaScript Math.round, toward
 * positive infinity. This is storage precision, not anatomical accuracy.
 * Zero rows remain present so the publication caller owns their removal.
 * The caller supplies correspondence-admitted rows. Incomplete rows, nonfinite
 * values, invalid identities and unrepresentable scaled arithmetic refuse
 * without changing the input.
 */
export function storeHumanBodyCorrectiveRows(
  rows: readonly number[],
): number[] {
  if (rows.length % 4 !== 0)
    throw new Error("Corrective storage needs complete sparse rows.");
  const output: number[] = [];
  const scale = 100_000;
  for (let offset = 0; offset < rows.length; offset += 4) {
    const vertex = rows[offset];
    if (!Number.isSafeInteger(vertex) || vertex < 0)
      throw new Error("Corrective storage needs exact nonnegative identities.");
    output.push(vertex);
    for (let axis = 1; axis <= 3; axis++) {
      const value = rows[offset + axis];
      const scaled = value * scale;
      if (!Number.isFinite(value) || !Number.isFinite(scaled))
        throw new Error("Corrective storage exceeded finite grid arithmetic.");
      output.push(Number((Math.round(scaled) / scale).toFixed(5)));
    }
  }
  return output;
}
