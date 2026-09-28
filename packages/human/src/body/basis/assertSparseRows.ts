/**
 * Admit one endpoint's sparse displacement rows.
 *
 * Rows are flat `[index, dx, dy, dz]` quadruples over a population of
 * `count` identities (surface vertices or landmarks). They must be finite,
 * strictly increasing by index, resident, and never an exact zero
 * displacement, which is the single format every surface, landmark
 * and corrective payload of the body basis shares. A caller names what it is
 * checking so the refusal points at the offending endpoint.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Rejects malformed named endpoint rows before they can be applied.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Enforces the strictly increasing, resident, nonzero `[index, dx, dy, dz]` row format.
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
  let previous = -1;
  for (let i = 0; i < rows.length; i += 4) {
    const index = rows[i];
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
