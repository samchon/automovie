import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A closed triangulated boundary standing for one logical volume.
 *
 * The shell is a single triangle soup rather than a list of shells, because
 * "outer boundary plus voids" is a reading of one closed surface and not a
 * second kind of record: an atrium void is inner facets wound the other way in
 * the same list, so a point in the void is outside the volume by the same
 * arithmetic that puts a point in the room inside it. That is exactly how
 * `IfcFacetedBrepWithVoids` reads, and it is why the containment query needs no
 * case for holes.
 *
 * Nothing is inferred from the mesh. It must already be closed — every directed
 * edge appearing once and its reverse once — and wound counter-clockwise seen
 * from outside the solid. `validateBuiltEnvironment` checks closure edge by
 * edge, but checks winding only through the sign of the total enclosed volume,
 * so a void wound the same way as the outer boundary passes and is then read
 * as solid. Self-intersection is not checked.
 *
 * @evidence contracts/common.md#principled-implementation Containment sums signed solid angles (Van Oosterom and Strackee) and volume applies the divergence theorem over triangles; validation requires finite vertices, whole in-range index triples, non-degenerate faces, every directed edge matched once forward and once reversed, and a positive total volume.
 * @evidence contracts/common.md#clear-and-simple-design Vertices plus flat index triples, with voids as inner facets of the same list, so containment and volume need no hole case, as the prose explains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the total signed volume is tested, so a mis-wound void is accepted and counted as solid, and self-intersecting facets are not detected; both are stated limitations, not compensated for.
 * @evidence contracts/common.md#meaningful-documentation States the closure and winding requirements and how much of each is actually checked, the index layout, the vertex and face floors, and the void convention.
 * @author Samchon
 */
export interface IAutoMovieSpaceShell {
  /** World-space vertices the triangles index; at least four. */
  vertices: IAutoMovieVector3[];

  /**
   * Triangles as flat vertex-index triples, so `triangles[3i]`,
   * `triangles[3i+1]` and `triangles[3i+2]` are one face. At least four faces,
   * because nothing fewer closes a solid.
   */
  triangles: number[];
}
