import {
  AutoMovieTextureBinding,
  IAutoMovieMaterial,
} from "@automovie/interface";

/** A material slot's texture binding as declared: absent as null or undefined. */
type DeclaredBinding = AutoMovieTextureBinding | null | undefined;

/** One material overlay, whose colour and normal maps are bound after the slots. */
type Overlay = NonNullable<IAutoMovieMaterial["overlays"]>[number];

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
      (overlay: Overlay): DeclaredBinding[] => [
        overlay.baseColorTexture,
        overlay.normalTexture,
      ],
    ),
  ].flatMap(present);

/**
 * A declared binding as a list: empty where the slot declares none, so the
 * absent slots drop out without a type guard.
 */
function present(value: DeclaredBinding): AutoMovieTextureBinding[] {
  return value === null || value === undefined ? [] : [value];
}