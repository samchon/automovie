import {
  AutoMovieTextureBinding,
  IAutoMovieMaterial,
} from "@automovie/interface";

/**
 * Every texture binding one material declares, in slot order, then the
 * thickness and anisotropy maps, then each overlay's colour and normal map,
 * nulls dropped.
 */
export const materialTextureBindings: (
  material: IAutoMovieMaterial,
) => AutoMovieTextureBinding[] = (
  material: IAutoMovieMaterial,
): AutoMovieTextureBinding[] =>
  [
    material.baseColorTexture,
    material.metallicRoughnessTexture,
    material.normalTexture,
    material.detailNormalTexture,
    material.occlusionTexture,
    material.emissiveTexture,
    material.thicknessTexture,
    material.anisotropy?.texture,
    ...(material.overlays ?? []).flatMap(
      (
        overlay: NonNullable<IAutoMovieMaterial["overlays"]>[number],
      ): (AutoMovieTextureBinding | null | undefined)[] => [
        overlay.baseColorTexture,
        overlay.normalTexture,
      ],
    ),
  ].filter(
    (
      value: AutoMovieTextureBinding | null | undefined,
    ): value is AutoMovieTextureBinding =>
      value !== null && value !== undefined,
  );
