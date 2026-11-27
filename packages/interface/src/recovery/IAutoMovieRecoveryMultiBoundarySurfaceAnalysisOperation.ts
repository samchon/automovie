import type { AutoMovieVector3Tuple } from "..";

/** Analyze coherent private surface incidence and complete boundary cycles. */

export namespace IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation {
  /** Analyze coherent private surface incidence and complete boundary cycles. */

  export type Operation = (
    vertices: readonly Readonly<AutoMovieVector3Tuple>[],
    triangles: readonly (readonly [number, number, number])[],
    fail: (reason: string) => never,
    edgeKey: (a: number, b: number) => string,
  ) => {
    /**
     * Undirected edge-incidence registry with the actual incident faces or
     * master-control bindings.
     */
    edges: Map<
      string,
      {
        /**
         * Original first endpoint index of this source edge, in the paired
         * source vertex array.
         */
        a: number;
        /**
         * Original second endpoint index of this source edge, in the paired
         * source vertex array.
         */
        b: number;
        /**
         * Original source-triangle ordinal, preserved through observation and
         * subdivision.
         */
        face: number;
      }[]
    >;

    /** Per-vertex neighbour maps used by the source topology and seam traversal. */
    adjacency: Map<number, number>[];

    /**
     * Per-vertex original incident-face ordinals, retained for source-topology
     * checks.
     */
    incident: number[][];

    /**
     * Admitted boundary cycles in deterministic traversal order; each entry
     * retains its own incidence rather than coordinate welding.
     */
    cycles: number[][];

    /** Sum of admitted source-triangle areas, in square millimetres. */
    areaMm2: number;
  };
}
