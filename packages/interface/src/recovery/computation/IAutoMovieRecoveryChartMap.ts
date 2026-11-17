/**
 * Harmonic unit-chart coordinates for an admitted physical triangle disk.
 * Boundary vertices have caller-fixed u/v values; interior coordinates are solved
 * from the immutable triangle incidence. RecoveryChartMap owns numeric admission
 * and termination. Its coordinate map is acquisition data, not generated geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Number of private observation vertices, including clipped edge observations. Coherently oriented private chart triangles; never generation input.
 * @evidence contracts/development/design.md#principled-representation Fixed normalized square-chart values, once per named boundary or guide vertex.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryChartMap, RecoveryChartSurface share IAutoMovieRecoveryChartMap's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Coherently oriented private chart triangles; never generation input.
 */

export namespace IAutoMovieRecoveryChartMap {
  /** Private chart incidence with an already ordered, curve-registered boundary.
   * @evidence contracts/development/design.md#principled-representation Source vertex identities and triangle edges define positive harmonic weights; boundary coordinates carry the declared curve correspondence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The topology owner supplies a chart and the map owner solves only its interior parameters.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither disk topology nor material correspondence is inferred from endpoint count or distance.
   * @evidence contracts/development/common.md#meaningful-documentation Records private addresses, normalized coordinates, numerical tolerance and finite work limits.
   */
  export interface Input {
    /** Number of private observation vertices, including clipped edge observations. */
    vertices: number;

    /** Coherently oriented private chart triangles; never generation input. */
    triangles: readonly (readonly [number, number, number])[];

    /** Fixed normalized square-chart values, once per named boundary or guide vertex. */
    fixed: readonly {
      /** Index into the supplied observation vertex array, not a generated control-registry index. */
      vertex: number;
      /** Normalized u coordinate in the declared local patch or unit source chart. */
      u: number;
      /** Normalized v coordinate in the declared local patch or unit source chart. */
      v: number;
    }[];

    /** Positive absolute linear-equation residual tolerance in normalized chart units. */
    tolerance: number;

    /** Positive maximum conjugate-gradient iterations for each coordinate. */
    maxIterations: number;
  }

  /** Observation-only coordinates and complete numerical/orientation findings.
   * @evidence contracts/development/design.md#principled-representation The returned harmonic coordinates retain fixed values and independently computed signed areas for every original chart triangle.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Linear convergence and parameter orientation qualify different properties and remain separate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Folded or collapsed triangles remain explicit; a converged solve does not certify a valid disk chart or a fitted surface.
   * @evidence contracts/development/common.md#meaningful-documentation States coordinate order, residual meaning, private witnesses and limited qualification.
   */
  export interface Result {
    /** Normalized chart coordinates in private input-vertex order. */
    parameters: [number, number][];

    /** True only when both linear residuals and all signed parameter areas pass. */
    qualified: boolean;

    /** Coordinate-wise actual iteration counts. */
    iterations: [number, number];

    /** Largest independently reconstructed linear-equation residual. */
    residual: number;

    /** Private triangle ordinals with nonpositive or nonfinite signed parameter area. */
    failedTriangles: number[];

    /** Solver, range and orientation limitations; no failure is repaired here. */
    diagnostics: string[];
  }
}
