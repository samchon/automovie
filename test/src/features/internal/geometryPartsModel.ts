import type {
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

/**
 * An imported model holding only the given parts, with no skeleton, body,
 * materials or asset, for geometry measures that read parts alone.
 *
 * @param parts The model's parts, in order.
 * @returns A fresh model the caller owns.
 */
export const geometryPartsModel: (
  parts: IAutoMovieModelPart[],
) => IAutoMovieModel = (parts: IAutoMovieModelPart[]): IAutoMovieModel => ({
  id: "geometry",
  name: "geometry",
  origin: "imported",
  parts,
  materials: [],
  skeleton: null,
  body: null,
  asset: null,
});
