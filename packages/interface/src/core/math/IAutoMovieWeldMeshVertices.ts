/**
 * Data and callback contracts shared by the WeldMeshVertices operations.
 *
 * @evidence contracts/development/design.md#principled-representation A first-occurrence identity table and one table ordinal per input XYZ tuple describe nanometre-grid topology welding without moving the source coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface weldMeshVertices exposes exactly the labels and original-order vertex mapping required by topology readers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Labels are identity tokens rather than coordinates; large-coordinate axes preserve exact binary64 identity and malformed XYZ input is refused by the producer.
 * @evidence contracts/development/common.md#meaningful-documentation Documents first-occurrence ordering, per-input alignment and the safe-grid/exact-coordinate distinction.
 */
export namespace IAutoMovieWeldMeshVertices {
  /**
   * Intern finite XYZ tuples in first-occurrence order using nanometre topology-grid identity. Invalid tuple cardinality, holes and nonfinite coordinates throw.
   * Safe rounded grid indexes keep their integer labels and signed-zero convention. Larger coordinates use an axis-local exact-coordinate label: adjacent binary64 values there are farther apart than one grid cell, so distinct coordinates cannot weld.
   *
   * @evidence contracts/development/design.md#principled-representation A first-occurrence identity table and one table ordinal per input XYZ tuple describe nanometre-grid topology welding without moving the source coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface weldMeshVertices exposes exactly the labels and original-order vertex mapping required by topology readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Labels are identity tokens rather than coordinates; large-coordinate axes preserve exact binary64 identity and malformed XYZ input is refused by the producer.
   * @evidence contracts/development/common.md#meaningful-documentation Documents first-occurrence ordering, per-input alignment and the safe-grid/exact-coordinate distinction.
   */
  export type IResult = {
    /** Distinct delimiter-safe grid identities in first-occurrence order. */
    labels: string[];

    /** One label ordinal per input XYZ tuple, in the original vertex order. */
    vertices: number[];
  };
}
