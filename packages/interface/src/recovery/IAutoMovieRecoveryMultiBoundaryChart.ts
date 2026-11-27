import type { AutoMovieVector3Tuple } from "..";

/**
 * A coherent genus-zero triangle observation opened into one disk by cutting a
 * boundary-connecting edge forest. RecoveryMultiBoundaryChart verifies complete
 * oriented boundary cycles, selects measured shortest paths, and duplicates
 * disconnected vertex fans. Positions stay in the original millimetre frame and
 * duplicated fans retain the same physical keys. The result preserves source
 * triangles for fitting and is not publishable reconstruction geometry;
 * unsupported topology or arithmetic throws.
 */

export namespace IAutoMovieRecoveryMultiBoundaryChart {
  /**
   * Immutable physical observations and complete oriented boundary cycles
   * admitted by RecoveryMultiBoundaryChart.
   */

  export type Input = {
    /**
     * Private physical positions in millimetres; returned positions include fan
     * duplicates.
     */
    verticesMm: readonly Readonly<AutoMovieVector3Tuple>[];

    /**
     * Private oriented incidence; returned triangles address the cut disk
     * vertices.
     */
    triangles: readonly (readonly [number, number, number])[];

    /**
     * Declared physical identities, including distinct cut-fan occurrences in
     * the result.
     */
    vertexKeys: readonly string[];

    /** Complete coherent boundary cycles of one orientable genus-zero component. */
    cycles: readonly (readonly number[])[];
  };

  /**
   * The cut observation disk, its physical source identities and independent
   * area-preservation measurement from RecoveryMultiBoundaryChart.
   */

  export type Result = {
    /**
     * Private physical positions in millimetres; returned positions include fan
     * duplicates.
     */
    verticesMm: Readonly<AutoMovieVector3Tuple>[];

    /**
     * Private oriented incidence; returned triangles address the cut disk
     * vertices.
     */
    triangles: [number, number, number][];

    /**
     * Declared physical identities, including distinct cut-fan occurrences in
     * the result.
     */
    vertexKeys: string[];

    /** Single coherent boundary of the resulting private cut disk. */
    boundaryCycle: number[];

    /** Actual source edges selected by the private connecting cut forest. */
    cutEdges: number;

    /** Actual extra vertex occurrences introduced to separate cut banks. */
    duplicatedFanVertices: number;

    /** Measured returned minus input triangle area in square millimetres. */
    sourceAreaDifferenceMm2: number;
  };
  /**
   * Cut a qualified genus-zero observation into a disk while preserving
   * original physical vertices and area. Invalid boundary cycles, unsupported
   * topology or nonrepresentable cuts throw; inputs remain borrowed and the
   * returned disk owns its duplicated fans.
   */
  export type Operation = (input: Input) => Result;
}
