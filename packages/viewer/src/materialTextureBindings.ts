import {
  AutoMovieTextureBinding,
  IAutoMovieMaterial,
} from "@automovie/interface";

/**
 * Every texture binding one material declares, in slot order and then each
 * overlay's colour and normal map, nulls dropped.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves this public surface into the declared render material.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the material and color binding at the render boundary.
 */
export const materialTextureBindings = (
  material: IAutoMovieMaterial,
): AutoMovieTextureBinding[] =>
  [
    material.baseColorTexture,
    material.metallicRoughnessTexture,
    material.normalTexture,
    material.detailNormalTexture,
    material.occlusionTexture,
    material.emissiveTexture,
    ...(material.overlays ?? []).flatMap((overlay) => [
      overlay.baseColorTexture,
      overlay.normalTexture,
    ]),
  ].filter(
    (value): value is AutoMovieTextureBinding =>
      value !== null && value !== undefined,
  );
