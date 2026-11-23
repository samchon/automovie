/**
 * Limit positions and face-varying normal indices for an admitted subdivision
 * level.
 *
 * Positions retain local metres; normal triples are unitless and cornerNormals
 * indexes the normal population rather than vertices. The caller supplies
 * admitted or refined topology; semi-sharpness is exhausted before limit masks,
 * and undefined or nonfinite limit normals refuse.
 */
export namespace IAutoMovieLimitSubdivisionLevel {
  /**
   * The evaluated limit positions and face-varying limit normals of every
   * vertex of a level.
   *
   * A vertex's limit is the limit of its child, so the level's points are
   * refined once without building the next level's connectivity, and each
   * vertex reads its child's quad one-ring from them: its vertex point, the
   * edge points of its fan edges and the face points of its fan faces. That
   * ring is all quads even when the level has other polygons. While any ring
   * edge keeps a semi-sharp sharpness between 0 and 10, the ring is refined on
   * its own, so a crease that outlasts the requested level still rounds off in
   * the limit exactly as further refinement would; at most ten such steps are
   * needed. `limitSubdivisionRing` then applies the limit masks.
   *
   * Normals are numbered vertex by vertex, sector by sector in fan order, and
   * each corner names the normal of the sector its face belongs to.
   *
   * All three arrays are newly allocated. The caller supplies a level from cage
   * admission or maintained refinement; no independent connectivity gate runs
   * here, and numerical normal refusal propagates.
   */
  export type IResult = {
    /**
     * New packed xyz limit positions in local metres, one triple per input
     * topology vertex in unchanged vertex order.
     */
    positions: number[];

    /**
     * New packed unit xyz normals in the level's frame, numbered vertex by
     * vertex and then by sharp-edge sector in fan order.
     */
    normals: number[];

    /**
     * One zero-based normal index per input face corner, aligned with
     * topology.faceVertices; crease-separated corners can select different
     * normals at one vertex.
     */
    cornerNormals: number[];
  };
}
