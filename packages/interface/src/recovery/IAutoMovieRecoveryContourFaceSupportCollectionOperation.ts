/** Callable broad original face support for a raw plane-cut contour. */

export namespace IAutoMovieRecoveryContourFaceSupportCollectionOperation {
  /**
   * Collect the union of original faces incident to each observed source vertex
   * or edge address. Use the caller's prepared unordered edge key and face
   * maps.
   */

  export type Operation = (
    points: readonly {
      /** First original point incidence endpoint used to resolve broad support. */
      a: number;
      /**
       * Second original point incidence endpoint, equal to the first for a
       * vertex hit.
       */
      b: number;
    }[],
    vertexFaces: ReadonlyMap<number, ReadonlySet<number>>,
    faceEdges: ReadonlyMap<string, ReadonlySet<number>>,
    edgeKey: (a: number, b: number) => string,
  ) => Set<number>;
}
