import type { IHumanFaceContactFloor } from "./IHumanFaceContactFloor";

/**
 * Read all affine contact floors at one candidate displacement.
 * Rows and vector share the three model-metre displacement coordinates;
 * slack is the existing metre admission tolerance. Empty rows return true.
 *
 * @evidence contracts/common.md#principled-implementation Dot products compare each original row's displacement reading with minimum minus slack. Current correction/projection consumers supply admitted finite three-coordinate normals/candidates; NaN readings fail the comparison rather than become accepted.
 * @evidence contracts/common.md#clear-and-simple-design One predicate serves the direct correction and native-QP verification, retaining exact shared affine acceptance while nonlinear signed admission stays with contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All rows participate, with no selected witness or added epsilon beyond supplied slack; true is only affine feasibility and does not certify nonlinear geometry or arbitrary malformed rows.
 * @evidence contracts/common.md#meaningful-documentation Prose states common coordinates, metre slack, empty-row behavior and the distinction between affine feasibility and physical contact admission.
 * @evidence contracts/performance.md#efficient-algorithms Each of R rows reduces three components, O(R), stopping at the first violation; no witness subset or geometry query is allocated.
 * @evidence contracts/performance.md#reuse-equivalent-work Both candidate paths reuse this predicate over their already-computed rows; changed candidates must be re-read and no result cache is kept.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Rows/vector are borrowed and only a boolean transfers; no state, handle, byte buffer or task is retained.
 */
export function isHumanFaceContactFloorSatisfied(
  rows: readonly IHumanFaceContactFloor[],
  vector: readonly number[],
  slack: number,
): boolean {
  return rows.every(
    (row: IHumanFaceContactFloor): boolean  =>
      row.normal.reduce((sum: number, value: number, axis: number): number  => sum + value * vector[axis], 0) >=
      row.minimum - slack,
  );
}
