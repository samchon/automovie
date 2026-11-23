/**
 * Union original triangle incidence at every sampled contour vertex or crossed
 * source edge. The resulting support can include adjacent faces and is not a
 * semantic region or an exact generating patch.
 */

export namespace IAutoMovieRecoveryContourFaceSupportCollectionOperation {
  /**
   * Union original triangle incidence at every sampled contour vertex or
   * crossed source edge. The resulting support can include adjacent faces and
   * is not a semantic region or an exact generating patch.
   */

  export type Operation = (
    points: readonly {
      /**
       * Original first endpoint index of this source edge, in the paired source
       * vertex array.
       */
      a: number;
      /**
       * Original second endpoint index of this source edge, in the paired
       * source vertex array.
       */
      b: number;
    }[],
    vertexFaces: ReadonlyMap<number, ReadonlySet<number>>,
    faceEdges: ReadonlyMap<string, ReadonlySet<number>>,
    edgeKey: (a: number, b: number) => string,
  ) => Set<number>;
}
