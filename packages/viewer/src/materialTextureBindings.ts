import {
  AutoMovieTextureBinding,
  IAutoMovieMaterial,
} from "@automovie/interface";

/**
 * Every texture binding one material declares, in slot order and then each
 * overlay's colour and normal map, nulls dropped.
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
