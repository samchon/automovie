/**
 * Harmonic unit-chart coordinates for an admitted physical triangle disk.
 * Boundary vertices have caller-fixed u/v values; interior coordinates are
 * solved from the immutable triangle incidence. RecoveryChartMap owns numeric
 * admission and termination. Its coordinate map is acquisition data, not
 * generated geometry.
 */

export namespace IAutoMovieRecoveryChartMap {
  /** Private chart incidence with an already ordered, curve-registered boundary. */
  export interface Input {
    /**
     * Number of private observation vertices, including clipped edge
     * observations.
     */
    vertices: number;

    /** Coherently oriented private chart triangles; never generation input. */
    triangles: readonly (readonly [number, number, number])[];

    /**
     * Fixed normalized square-chart values, once per named boundary or guide
     * vertex.
     */
    fixed: readonly {
      /**
       * Index into the supplied observation vertex array, not a generated
       * control-registry index.
       */
      vertex: number;
      /**
       * Normalized u coordinate in the declared local patch or unit source
       * chart.
       */
      u: number;
      /**
       * Normalized v coordinate in the declared local patch or unit source
       * chart.
       */
      v: number;
    }[];

    /**
     * Positive absolute linear-equation residual tolerance in normalized chart
     * units.
     */
    tolerance: number;

    /** Positive maximum conjugate-gradient iterations for each coordinate. */
    maxIterations: number;
  }

  /** Observation-only coordinates and complete numerical/orientation findings. */
  export interface Result {
    /** Normalized chart coordinates in private input-vertex order. */
    parameters: [number, number][];

    /** True only when both linear residuals and all signed parameter areas pass. */
    qualified: boolean;

    /** Coordinate-wise actual iteration counts. */
    iterations: [number, number];

    /** Largest independently reconstructed linear-equation residual. */
    residual: number;

    /**
     * Private triangle ordinals with nonpositive or nonfinite signed parameter
     * area.
     */
    failedTriangles: number[];

    /** Solver, range and orientation limitations; no failure is repaired here. */
    diagnostics: string[];
  }
}
