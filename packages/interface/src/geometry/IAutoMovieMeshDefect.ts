/**
 * Located defect carrying the original vertices of one edge or one triangle in
 * the measured buffer.
 */
export interface IAutoMovieMeshDefect {
  /**
   * Edge or triangle class assigned by the defect census. The class determines
   * the length and interpretation of vertices.
   */
  kind: IAutoMovieMeshDefect.Kind;

  /**
   * Original vertex ordinals before welding. Edge classes preserve first
   * traversed endpoint order, and triangle classes preserve all three stored
   * corners.
   */
  vertices: number[];
}

/** Classes of topology and aspect defects localized to source mesh vertices. */
export namespace IAutoMovieMeshDefect {
  /**
   * Defect category distinguishing an open, inconsistent or nonmanifold edge
   * from a collapsed or sliver triangle.
   */
  export type Kind =
    | "open"
    | "non-manifold"
    | "inconsistent"
    | "degenerate"
    | "sliver";
}
