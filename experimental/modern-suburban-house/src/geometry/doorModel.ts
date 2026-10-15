import type { IAutoMovieModelPart, IAutoMovieModel } from "@automovie/interface";


/**
 * Generated exterior-door model `exterior-door:<name>` holding the given parts, with unbound
 * materials.
 */
export const doorModel = (
  name: string,
  parts: IAutoMovieModelPart[]
): IAutoMovieModel => ({
  id: `exterior-door:${name}`,
  name,
  origin: "generated",
  parts,
  skeleton: null,
  body: null,
  materials: [],
  asset: null,
});
