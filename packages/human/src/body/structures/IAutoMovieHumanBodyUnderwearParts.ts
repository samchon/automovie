import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

/**
 * The underwear the builder appends to a body model: its material and parts.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearParts {
  /** The garment's material. */
  material: IAutoMovieMaterial;

  /** The garment's parts, one per surface with kept triangles. */
  parts: IAutoMovieModel["parts"];
}
