/** Data and callback contracts shared by the WeldMeshVertices operations. */
export namespace IAutoMovieWeldMeshVertices {
  /**
   * Intern finite XYZ tuples in first-occurrence order using nanometre
   * topology-grid identity. Invalid tuple cardinality, holes and nonfinite
   * coordinates throw. Safe rounded grid indexes keep their integer labels and
   * signed-zero convention. Larger coordinates use an axis-local
   * exact-coordinate label: adjacent binary64 values there are farther apart
   * than one grid cell, so distinct coordinates cannot weld.
   */
  export type IResult = {
    /** Distinct delimiter-safe grid identities in first-occurrence order. */
    labels: string[];

    /** One label ordinal per input XYZ tuple, in the original vertex order. */
    vertices: number[];
  };
}
