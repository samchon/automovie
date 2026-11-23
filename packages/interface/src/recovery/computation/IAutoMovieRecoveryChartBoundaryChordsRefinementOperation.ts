import type { AutoMovieVector3Tuple } from "../../index";

/**
 * Subdivide private interior edges whose fixed endpoints share one square side.
 * Such a chord has zero transverse UV extent under square Dirichlet data and
 * can collapse an incident ear even for a valid PL disk. Its source-PL midpoint
 * is a new free map vertex, and both incident triangles retain coherent
 * orientation. Original coordinates, boundary observations and physical
 * identities are copied; paired cut occurrences receive equal midpoint keys
 * without ordinal welding. This removes the specific fixed chord obstruction,
 * not all harmonic degeneracy. The consumer must still check every actual
 * signed UV area before fitting.
 */

export namespace IAutoMovieRecoveryChartBoundaryChordsRefinementOperation {
  /**
   * Subdivide private interior edges whose fixed endpoints share one square
   * side. Such a chord has zero transverse UV extent under square Dirichlet
   * data and can collapse an incident ear even for a valid PL disk. Its
   * source-PL midpoint is a new free map vertex, and both incident triangles
   * retain coherent orientation. Original coordinates, boundary observations
   * and physical identities are copied; paired cut occurrences receive equal
   * midpoint keys without ordinal welding. This removes the specific fixed
   * chord obstruction, not all harmonic degeneracy. The consumer must still
   * check every actual signed UV area before fitting.
   */

  export type Operation = (input: {
    /**
     * Borrowed physical positions in the registered millimetre frame; indices
     * in triangles address this array.
     */
    verticesMm: readonly Readonly<AutoMovieVector3Tuple>[];

    /**
     * Oriented triangle vertex-index triples addressing the paired position
     * array; indices are not control IDs.
     */
    triangles: readonly (readonly [number, number, number])[];

    /**
     * Stable physical vertex identities used for deterministic boundary and
     * seam choices.
     */
    vertexKeys: readonly string[];

    /**
     * Four ordered chart-boundary vertex paths in the chart owner's fixed side
     * convention; indices address verticesMm.
     */
    sides: readonly (readonly number[])[];
  }) => {
    /**
     * Borrowed physical positions in the registered millimetre frame; indices
     * in triangles address this array.
     */
    verticesMm: Readonly<AutoMovieVector3Tuple>[];

    /**
     * Oriented triangle vertex-index triples addressing the paired position
     * array; indices are not control IDs.
     */
    triangles: [number, number, number][];

    /**
     * Stable physical vertex identities used for deterministic boundary and
     * seam choices.
     */
    vertexKeys: string[];

    /** Number of boundary chords split to preserve the declared chart topology. */
    subdividedChords: number;
  };
}
