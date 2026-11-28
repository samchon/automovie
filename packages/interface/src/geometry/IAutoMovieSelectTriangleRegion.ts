/** Connectivity and boundary inputs for selecting a triangle patch. */
export namespace IAutoMovieSelectTriangleRegion {
  /**
   * Connectivity and an oriented boundary for selecting one side of a mesh
   * patch.
   *
   * The boundary closes implicitly. The selected patch cannot reach an exterior
   * free edge beyond that loop. The result keeps original triangle ordinals in
   * ascending order.
   */
  export type IProps = {
    /**
     * Borrowed nonnegative safe-integer vertex identities in groups of three,
     * distinct within each face. Shared edges have at most two oppositely wound
     * uses.
     */
    indices: readonly number[];

    /**
     * Borrowed oriented loop of at least three distinct nonnegative
     * safe-integer vertex identities. The a-to-b direction selects the face
     * with the same directed edge.
     */
    boundary: readonly number[];
  };
}
