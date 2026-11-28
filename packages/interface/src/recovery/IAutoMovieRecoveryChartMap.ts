/**
 * Input and output contracts for harmonic parameterization of observed chart
 * incidence.
 */

export namespace IAutoMovieRecoveryChartMap {
  /**
   * Provide private triangle incidence and fixed unit-square anchors for a
   * harmonic chart solve.
   */
  export interface Input {
    /** Number of private original chart vertices. */
    vertices: number;

    /**
     * Three distinct original vertex indices per triangle, in the source
     * orientation order.
     */
    triangles: readonly (readonly [number, number, number])[];

    /** Fixed normalized [u, v] anchors at unique vertex indices. */
    fixed: readonly {
      /** Original observation vertex selected as a fixed chart anchor. */
      vertex: number;
      /** Fixed U coordinate in [0, 1]. */
      u: number;
      /** Fixed V coordinate in [0, 1]. */
      v: number;
    }[];

    /**
     * Positive absolute residual tolerance for the reconstructed normalized
     * Laplacian equations.
     */
    tolerance: number;

    /** Positive iteration cap for each coordinate solve. */
    maxIterations: number;
  }

  /**
   * Harmonic UV coordinates with available equation, square-range and
   * orientation evidence.
   */
  export interface Result {
    /** Normalized [u, v] coordinates in private input-vertex order. */
    parameters: [number, number][];

    /**
     * Whether square range, original graph residual and all signed triangle
     * areas pass.
     */
    qualified: boolean;

    /** Actual conjugate-gradient updates for U and V, respectively. */
    iterations: [number, number];

    /**
     * Largest absolute reconstructed graph equation residual over both free
     * coordinate fields.
     */
    residual: number;

    /**
     * Original triangle ordinals whose signed UV area is nonpositive or
     * nonrepresentable.
     */
    failedTriangles: number[];

    /** Available solver, range and parameter orientation findings. */
    diagnostics: string[];
  }
}
