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
 *
 * @evidence contracts/common.md#principled-implementation A grid step of 1e-5 metres uses the existing publication Math.round and decimal encoding convention; indices remain exact. Floating multiplication and division also contribute roundoff, and representable spacing can exceed the grid at large magnitudes. Scaled arithmetic must remain finite, without asserting anatomical precision.
 * @evidence contracts/common.md#clear-and-simple-design One pass validates identities and quantizes three displacement values per row; removing zero rows stays with the publication consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The grid is the recorded numerical storage convention shared by the corrective merge and offline source compiler, independent of a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation States ownership, sparse-row units, signed tie behavior, zero-row responsibility and refusal effects.
 * @evidence contracts/modeling.md#spatial-conventions Vertex identities are dimensionless integers and displacements are metres in the caller's unchanged frame; only numerical storage precision changes.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This numerical storage helper defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The helper defines no authoring channel and converts no anatomical measurement.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The helper stores existing numerical rows and emits no geometric primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The helper constructs no joint or boundary and preserves admitted source identities.
 * @evidenceExclude contracts/modeling.md#rendered-observation The helper owns numerical storage only; corrective preparation and the consuming body or person assembly retain observation of their geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical storage precision establishes no anatomical value, proportion or tissue behavior.
 * @evidenceExclude contracts/anatomy.md#permitted-range Arithmetic admission does not establish an anatomical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The helper defines no input through which a caller shapes a human form.
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
