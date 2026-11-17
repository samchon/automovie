

/** Data and callback contracts shared by the SolidZip operations. */
export namespace IAutoMovieSolidZip {
  /**
     * Matching vertex and cyclic-parameter arrays in their boundary order.
     *
     * @evidence contracts/development/design.md#principled-representation Vertex labels and a one-turn scalar correspondence describe one boundary for monotone zipper traversal.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Two parallel arrays preserve mesh identity without copying world positions into this operator.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not enforce equal lengths, finite monotone parameters, distinct vertices or compatible geometry with another boundary.
     * @evidence contracts/development/common.md#meaningful-documentation Names vertex/parameter correspondence and the parameter's 2pi periodic convention.
     */
    export interface ISequence {
      /** Vertex indices of the mesh. */
      vertices: number[];
  
      /** Cyclic parameter with period 2pi, any branch; mesh callers commonly use normalized arclength. */
      angles: number[];
    }
}
