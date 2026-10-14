/**
 * Store admitted corrective displacement rows on the publication convention's ten-micrometre grid, returning an independently owned sparse-row array.
 *
 * Rows are [vertex, dx, dy, dz] in the caller's unchanged metre frame. Vertex identities remain exact; displacement ties use JavaScript Math.round, toward positive infinity. This is storage precision, not anatomical accuracy. Zero rows remain present so the publication caller owns their removal. The caller supplies correspondence-admitted rows. Incomplete rows, nonfinite values, invalid identities and unrepresentable scaled arithmetic refuse without changing the input.
 *
 * @evidence contracts/common.md#principled-implementation Each complete sparse row preserves its nonnegative safe-integer vertex and rounds metre displacement to the publication's 1e-5 metre grid with Math.round ties toward positive infinity.
 * @evidence contracts/common.md#clear-and-simple-design One row walk validates identities and finite scaled arithmetic before appending to an independently owned output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Storage quantization cannot certify anatomical accuracy or source correspondence, and zero rows remain for the publication owner to remove.
 * @evidence contracts/common.md#meaningful-documentation The prose specifies row layout, metre frame, tie direction, ownership, refusal and the caller's prior correspondence admission.
 * @evidence contracts/performance.md#efficient-algorithms A fixed three displacement components per row gives linear input work and output size without sorting or geometry evaluation.
 * @evidence contracts/performance.md#reuse-equivalent-work One fixed grid scale serves all rows; this cheap serialization arithmetic needs no cross-call cache or copied correspondence state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the owned sparse-row output escapes; counters and formatting temporaries expire without retaining source rows or external work.
 */
export function storeHumanBodyCorrectiveRows(
  rows: readonly number[],
): number[] {
  if (rows.length % 4 !== 0)
    throw new Error("Corrective storage needs complete sparse rows.");
  const output: number[] = [];
  const scale: number = 100_000;
  for (let offset: number = 0; offset < rows.length; offset += 4) {
    const vertex: number = rows[offset];
    if (!Number.isSafeInteger(vertex) || vertex < 0)
      throw new Error("Corrective storage needs exact nonnegative identities.");
    output.push(vertex);
    for (let axis: number = 1; axis <= 3; axis++) {
      const value: number = rows[offset + axis];
      const scaled: number = value * scale;
      if (!Number.isFinite(value) || !Number.isFinite(scaled))
        throw new Error("Corrective storage exceeded finite grid arithmetic.");
      output.push(Number((Math.round(scaled) / scale).toFixed(5)));
    }
  }
  return output;
}
