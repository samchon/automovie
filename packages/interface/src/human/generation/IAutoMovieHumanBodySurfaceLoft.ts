/**
 * Hole-edge chart polygons and their corresponding emitted vertex-index lists.
 * Runtime construction and admission remain with AutoMovieHumanBodySurfaceLoft
 * in Human.
 */
export namespace IAutoMovieHumanBodySurfaceLoft {
  /**
   * Closed trim polygon in the base chain's [station, phase] chart, using
   * millimetres and radians. The hole-edge reader uses it to select the
   * retained mesh boundary.
   */
  export type HoleEdgeLoopPolygon = [number, number][];

  /**
   * Corresponding mesh vertex indices and [station, phase] chart points for the
   * selected hole edge, in the same cyclic order. Stations use millimetres and
   * phases use radians.
   */
  export type HoleEdgeResult = [number[], [number, number][]];
}
