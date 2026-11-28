import type { IAutoMovieSubdivisionCrease } from "./IAutoMovieSubdivisionCrease";

/**
 * An authored polygon control cage for subdivision in a local metre frame.
 *
 * Supply at least one vertex and face. Each polygon has at least three distinct
 * corners. Faces wind counterclockwise on the outward side and share each
 * interior edge in opposite directions. Faces incident on a vertex form one
 * connected fan, and each vertex belongs to at least one face.
 *
 * Supply UV values and their corner indices together. Faces can use different
 * UV indices for either endpoint of a seam. Each UV value belongs to one
 * geometric vertex and is used by at least one face corner.
 */
export interface IAutoMovieSubdivisionCage {
  /** Dense finite packed XYZ in metres, one triple per original vertex. */
  positions: readonly number[];

  /**
   * Polygons as safe vertex ordinals, at least three distinct corners, wound
   * counter-clockwise about their outward side.
   */
  faces: ReadonlyArray<readonly number[]>;

  /**
   * Dense finite packed UV pairs. Omit this array and uvFaces together for a
   * surface without UVs.
   */
  uvs?: readonly number[];

  /** Safe UV value ordinals grouped by face, with one index per face corner. */
  uvFaces?: ReadonlyArray<readonly number[]>;

  /** Sharp or semi-sharp edges; omitted means every interior edge is smooth. */
  creases?: readonly IAutoMovieSubdivisionCrease[];
}
