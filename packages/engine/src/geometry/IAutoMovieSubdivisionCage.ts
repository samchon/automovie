import { IAutoMovieSubdivisionCrease } from "./IAutoMovieSubdivisionCrease";

/**
 * The control polygon mesh that `subdivideAutoMovieSurface` refines.
 *
 * A cage is quad-dominant but may carry any polygon of three or more corners.
 * It must be a manifold with consistent winding: every edge belongs to one face
 * (a boundary) or two faces that traverse it in opposite directions, every
 * vertex belongs to at least one face, and the faces around each vertex form one
 * fan. Faces wind counter-clockwise seen from the side the normals point to.
 *
 * UVs are face-varying, as in OpenSubdiv: each face corner names a UV value, so
 * a seam is an edge whose two faces name different values at either end. Every
 * UV value belongs to the corners of exactly one vertex.
 *
 * @evidence contracts/development/design.md#principled-representation Positions and UVs use the glTF packed layout of `IAutoMovieMesh`, faces are index polygons, and UV topology is the indexed face-varying model of OpenSubdiv, so seams are declared by index rather than inferred from coincident values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record holds exactly what Catmull-Clark needs: vertex positions, polygon connectivity, optional face-varying UVs and optional edge sharpness; boundaries need no declaration because they follow from connectivity.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is repaired: a non-manifold edge, inconsistent winding, a vertex with two fans, an unused vertex or UV, or a UV shared by two vertices is refused by `subdivideAutoMovieSurface`.
 * @evidence contracts/development/common.md#meaningful-documentation States the manifold, winding and usage requirements, the face-varying UV model and how a seam is expressed, the units and layouts, and what omitted UVs and creases mean.
 */
export interface IAutoMovieSubdivisionCage {
  /** Packed vertex positions `[x, y, z, ...]` in metres, finite. */
  positions: readonly number[];

  /**
   * Polygons as vertex indices, at least three distinct corners each, wound
   * counter-clockwise about their outward side.
   */
  faces: ReadonlyArray<readonly number[]>;

  /**
   * Packed face-varying UV values `[u, v, ...]`, finite; omitted means the
   * surface carries no UVs, and then `uvFaces` is omitted too.
   */
  uvs?: readonly number[];

  /**
   * UV value indices per face corner, the same shape as `faces`: corner `k` of
   * face `f` takes UV `uvFaces[f][k]`.
   */
  uvFaces?: ReadonlyArray<readonly number[]>;

  /** Sharp or semi-sharp edges; omitted means every interior edge is smooth. */
  creases?: readonly IAutoMovieSubdivisionCrease[];
}
