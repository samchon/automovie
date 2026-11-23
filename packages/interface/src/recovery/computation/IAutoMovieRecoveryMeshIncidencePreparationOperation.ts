import type { IAutoMovieRecoveryInput } from "../../index";

/** Prepare declared source aliases and original edge/vertex face incidence. */

export namespace IAutoMovieRecoveryMeshIncidencePreparationOperation {
  /** Prepare declared source aliases and original edge/vertex face incidence. */

  export type Operation = (
    input: Pick<
      IAutoMovieRecoveryInput,
      "triangles" | "exactCoordinateAliases"
    >,
    vertices: IAutoMovieRecoveryInput["verticesMm"],
  ) => {
    /**
     * Exact-position serialization key to the first admitted canonical vertex
     * index.
     */
    aliases: Map<string, number>;

    /**
     * One in-range canonical connectivity index per original vertex; this does
     * not move source coordinates.
     */
    canon: Int32Array;

    /**
     * Registered source mesh borrowing its original positions and faces with
     * the admitted canonical connectivity array.
     */
    mesh: {
      /**
       * Physical vertex positions in the registered millimetre chart, aligned
       * with the supplied triangle indices.
       */
      vertices: IAutoMovieRecoveryInput["verticesMm"];

      /**
       * Oriented triangle vertex-index triples addressing the paired position
       * array; indices are not control IDs.
       */
      triangles: IAutoMovieRecoveryInput["triangles"];

      /**
       * One in-range canonical connectivity index per original vertex; this
       * does not move source coordinates.
       */
      canon: Int32Array;
    };

    /** Canonical undirected edge identity to original incident-face set. */
    faceEdges: Map<string, Set<number>>;

    /**
     * Original vertex index to incident original-face set; borrowed for this
     * observation pass.
     */
    vertexFaces: Map<number, Set<number>>;

    /**
     * Returns a deterministic undirected key from two connectivity indices
     * without comparing positions.
     */
    edgeKey: (a: number, b: number) => string;
  };
}
