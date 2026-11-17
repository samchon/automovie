/**
 * Data and callback contracts shared by the SolidMeshIncidence operations.
 *
 * @evidence contracts/development/design.md#principled-representation IWalk represents a directed left boundary in the native periodic cover, coindexing IDs and integer lifts with a closing winding.
 * @evidence contracts/development/design.md#minimal-and-owned-surface SolidMeshIncidence supplies these boundary components to mesh planning and open-end extraction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The type carries actual occurrences rather than merging equal IDs across turns; incidence construction checks valid walks.
 * @evidence contracts/development/common.md#meaningful-documentation States nonrepeated closing vertex, first lift zero and total return turn.
 */
export namespace IAutoMovieSolidMeshIncidence {
  /**
   * One directed left boundary component in the native parameter cover.
   *
   * @evidence contracts/development/design.md#principled-representation Original vertex IDs and integer lifts describe the walk without converting identified surface points to an annular polygon.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Parallel ID/lift arrays plus total winding expose its complete combinatorial path.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record does not claim a nonzero-winding walk bounds a planar region or that one component owns an entire face.
   * @evidence contracts/development/common.md#meaningful-documentation States cover origin, omitted repeated closing point and winding meaning.
   */
  export interface IWalk {
    /** Original vertex IDs, without repeating the closing vertex. */
    vertices: number[];

    /** Period integers added at each vertex; the first is zero. */
    lifts: number[];

    /** Total period change on returning to the first vertex ID. */
    winding: number;
  }
}
