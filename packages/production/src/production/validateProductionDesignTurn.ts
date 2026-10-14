/**
 * Return the represented XZ determinant of two edges in caller units.
 *
 * @evidence contracts/common.md#principled-implementation The two-dimensional cross product of first-to-second and first-to-third edges gives signed represented area in squared caller units. IEEE-754 subtraction and multiplication can round, overflow or cancel; polygon and segment callers judge finite values and their own degeneracy tolerances.
 * @evidence contracts/common.md#clear-and-simple-design Polygon bends and segment orientation share the same determinant without moving their different acceptance policies into this arithmetic helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normalization, scale adjustment, clamping or exact-arithmetic fallback changes the supplied coordinates or represented determinant.
 * @evidence contracts/common.md#meaningful-documentation States XZ edge orientation, squared units and the possibility of nonfinite or degenerate results; this returns arithmetic rather than a polygon-validity verdict.
 * @evidence contracts/performance.md#efficient-algorithms Fixed subtraction and multiplication take constant work and storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This stateless arithmetic expression coordinates no repeated request or result cache; each caller supplies its current three coordinates.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the scalar result escapes; borrowed points are not retained and no population, handle or task is acquired.
 */
export const validateProductionDesignTurn: (first: { x: number; z: number; }, second: { x: number; z: number; }, third: { x: number; z: number; }) => number = (
  first: { x: number; z: number },
  second: { x: number; z: number },
  third: { x: number; z: number },
): number =>
  (second.x - first.x) * (third.z - first.z) -
  (second.z - first.z) * (third.x - first.x);
