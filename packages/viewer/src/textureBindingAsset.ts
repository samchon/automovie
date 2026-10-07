import { AutoMovieTextureBinding } from "@automovie/interface";

/**
 * The asset id a legacy or structured binding names.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves this public surface into the declared render material.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the material and color binding at the render boundary.
 */
export const textureBindingAsset = (
  binding: AutoMovieTextureBinding,
): string => (typeof binding === "string" ? binding : binding.asset);
