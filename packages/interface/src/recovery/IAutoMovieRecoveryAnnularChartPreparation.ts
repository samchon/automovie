import type { AutoMovieVector3Tuple } from "..";

/**
 * Cut a private oriented annular triangle chart along an observed edge path.
 * Two coherent boundary cycles become bottom/top and the duplicated seam
 * becomes left/right. Original positions and faces stay private observations
 * for fitting. The caller establishes genus zero and exactly two boundary
 * cycles beforehand. A seam touching another boundary vertex is refused rather
 * than changing topology.
 */

export namespace IAutoMovieRecoveryAnnularChartPreparation {
  /**
   * Cut a private oriented annular triangle chart along an observed edge path.
   * Two coherent boundary cycles become bottom/top and the duplicated seam
   * becomes left/right. Original positions and faces stay private observations
   * for fitting. The caller establishes genus zero and exactly two boundary
   * cycles beforehand. A seam touching another boundary vertex is refused
   * rather than changing topology.
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
     * Original before-side boundary observations or their source-face support,
     * retaining the supplied side order.
     */
    before: readonly number[];

    /**
     * Original after-side boundary observations or their source-face support,
     * retaining the supplied side order.
     */
    after: readonly number[];
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

    /**
     * Four ordered chart-boundary vertex paths in the chart owner's fixed side
     * convention; indices address verticesMm.
     */
    sides: [number[], number[], number[], number[]];

    /** Ordered source vertex indices forming the selected annular cut path. */
    seam: number[];

    /** Length of the chosen physical annular-chart seam in millimetres. */
    seamLengthMm: number;
  };
}
