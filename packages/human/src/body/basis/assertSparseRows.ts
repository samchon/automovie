/**
 * Admit one endpoint's sparse displacement rows.
 *
 * Rows are flat `[index, dx, dy, dz]` quadruples over a population of `count` identities (surface vertices or landmarks). They must be finite, strictly increasing by index, resident, and never an exact zero displacement, which is the single format every surface, landmark and corrective payload of the body basis shares. A caller names what it is checking so the refusal points at the offending endpoint.
 *
 * @evidence contracts/common.md#principled-implementation Finite complete quadruples with strictly increasing resident integer indices and nonzero meter displacement admit the common sparse row representation.
 * @evidence contracts/common.md#clear-and-simple-design One row guard serves skin, landmarks and corrective payloads while the caller supplies the resident population and located label.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty/zero, duplicate, unordered or nonresident rows cannot silently become a valid source endpoint.
 * @evidence contracts/common.md#meaningful-documentation The prose gives quadruple layout, meter offsets, shared source scope and endpoint-labeled failure meaning.
 * @evidence contracts/performance.md#efficient-algorithms Finite scanning and one ordered quadruple pass cost O(N) row values with O(1) additional state; ordering avoids an index set or sort.
 * @evidence contracts/performance.md#reuse-equivalent-work All row consumers reuse one representation guard, without caching admission for arrays that callers may change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar loop state is local and no row copy or task survives synchronous success/failure.
 */
export function assertSparseRows(
  rows: number[],
  count: number,
  label: string,
): void {
  if (
    rows.length === 0 ||
    rows.length % 4 !== 0 ||
    !rows.every(Number.isFinite)
  )
    throw new Error(
      "Body sparse rows need finite [index, dx, dy, dz] quadruples: " + label,
    );
  let previous: number = -1;
  for (let i: number = 0; i < rows.length; i += 4) {
    const index: number = rows[i];
    if (!Number.isInteger(index) || index <= previous || index >= count)
      throw new Error(
        "Body sparse rows must be strictly increasing resident indices: " +
          label,
      );
    if (rows[i + 1] === 0 && rows[i + 2] === 0 && rows[i + 3] === 0)
      throw new Error(
        "Body sparse rows must describe a nonzero displacement: " + label,
      );
    previous = index;
  }
}
