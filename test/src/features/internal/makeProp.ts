import {
  IAutoMovieBody,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

/**
 * Create prop-1 from borrowed parts and optional body with no skeleton or materials. The fixture supplies no geometry repair or body admission and preserves the caller's records for the tested engine seam.
 */
export function makeProp(
  parts: IAutoMovieModelPart[],
  body: IAutoMovieBody | null = null,
): IAutoMovieModel {
  return {
    id: "prop-1",
    name: null,
    origin: "generated",
    skeleton: null,
    body,
    materials: [],
    parts,
    asset: null,
  };
}
