import type { IAutoMovieRecoveryInput } from "..";

/**
 * Callable preparation of source vertex aliases and original-face lookup
 * tables.
 */

export namespace IAutoMovieRecoveryMeshIncidencePreparationOperation {
  /**
   * Prepare original vertex and edge face incidence over the supplied
   * registered mesh. Optionally identify equal Cartesian tuples by their first
   * original position. Return the borrowed mesh arrays, canonical addresses and
   * shared index maps.
   */

  export type Operation = (
    input: Pick<
      IAutoMovieRecoveryInput,
      "triangles" | "exactCoordinateAliases"
    >,
    vertices: IAutoMovieRecoveryInput["verticesMm"],
  ) => {
    /**
     * Exact-position serialized key to first original coordinate address when
     * aliasing is selected.
     */
    aliases: Map<string, number>;

    /**
     * Original vertex to canonical original representative in aligned vertex
     * order.
     */
    canon: Int32Array;

    /** Borrowed original mesh geometry with the prepared canonical address map. */
    mesh: {
      /** Borrowed registered Cartesian positions in millimetres. */
      vertices: IAutoMovieRecoveryInput["verticesMm"];

      /** Borrowed original vertex-index triples in face ordinal order. */
      triangles: IAutoMovieRecoveryInput["triangles"];

      /**
       * Canonical source vertex addresses reused by the returned incidence
       * maps.
       */
      canon: Int32Array;
    };

    /** Undirected canonical edge keys to original incident source faces. */
    faceEdges: Map<string, Set<number>>;

    /** Canonical vertex addresses to original incident source faces. */
    vertexFaces: Map<number, Set<number>>;

    /** Forms the unordered canonical edge key used in the returned map. */
    edgeKey: (a: number, b: number) => string;
  };
}
