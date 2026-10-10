/**
 * A named area of a basis's skin, face or body: a set of vertices of one
 * surface.
 *
 * Measurement rules refer to a skin area by name, never by a vertex list,
 * because vertex numbers belong to one basis's topology. A rule that must keep
 * a feature out of a search (the person head breadth keeps `ear-right` and
 * `ear-left` out of its euryon search, `readHumanHeadBreadth`) names the
 * area; the basis states which of its vertices it holds. A
 * rule naming an area the basis does not declare refuses by that name.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinRegion {
  /** Index into the basis's surfaces. */
  surface: number;

  /** Vertex indices in that surface, strictly increasing. */
  vertices: number[];
}
