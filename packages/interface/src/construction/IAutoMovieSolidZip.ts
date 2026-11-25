/** Data and callback contracts shared by the SolidZip operations. */
export namespace IAutoMovieSolidZip {
  /** Matching vertex and cyclic-parameter arrays in their boundary order. */
  export interface ISequence {
    /** Vertex indices of the mesh. */
    vertices: number[];

    /**
     * Cyclic parameter with period 2pi, any branch; mesh callers commonly use
     * normalized arclength.
     */
    angles: number[];
  }
}
