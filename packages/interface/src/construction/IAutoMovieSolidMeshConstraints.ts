

/** Data and callback contracts shared by the SolidMeshConstraints operations. */
export namespace IAutoMovieSolidMeshConstraints {
  /**
     * An existing straight native-chart segment and its periodic lift.
     *
     * @evidence contracts/development/design.md#principled-representation Endpoint IDs name original evaluated vertices; turn selects the second endpoint's sheet without changing its identity.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Two IDs and one integer expose the complete indexed segment.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains no inferred world point, normal or positional weld.
     * @evidence contracts/development/common.md#meaningful-documentation Members state endpoint authority and the cover-turn convention.
     */
    export interface ISegment {
      /** Original first endpoint ID. */
      a: number;
  
      /** Original second endpoint ID. */
      b: number;
  
      /** Integer periods added to b's stored phase; zero in a nonperiodic chart. */
      turn: number;
    }

  /**
     * One subconstraint with every inducing input segment preserved.
     *
     * @evidence contracts/development/design.md#principled-representation The indexed subsegment and its source list preserve the input-to-refinement relation across overlaps and T junctions.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Extends the same segment record with one explicit provenance array.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Duplicate geometry does not discard an inducing segment or replace a vertex identity.
     * @evidence contracts/development/common.md#meaningful-documentation Sources index the original segment population, independently of output ordering.
     */
    export interface IEdge extends IAutoMovieSolidMeshConstraints.ISegment {
      /** Original input segment indices that contain this subconstraint. */
      sources: number[];
    }
}
