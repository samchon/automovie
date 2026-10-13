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
 * from outside the solid, both of which `validateBuiltEnvironment` checks,
 * because a boundary with a gap in it has no inside and a boundary turned
 * inside out has the wrong one.
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
