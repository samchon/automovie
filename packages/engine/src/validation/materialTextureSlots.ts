import {
  AutoMovieTextureBinding,
  IAutoMovieMaterial,
  IAutoMovieMaterialOverlay,
  type IAutoMovieMaterialTextureSlotsMaterialTextureSlot,
} from "@automovie/interface";

/**
 * Own-slot order: base color, metallic-roughness, normal, detail normal,
 * occlusion, emissive, then thickness.
 */
const OWN_SLOTS: ReadonlyArray<{
  field:
    | "baseColorTexture"
    | "metallicRoughnessTexture"
    | "normalTexture"
    | "detailNormalTexture"
    | "occlusionTexture"
    | "emissiveTexture"
    | "thicknessTexture";
  colorSpace: "srgb" | "linear";
}> = [
  { field: "baseColorTexture", colorSpace: "srgb" },
  { field: "metallicRoughnessTexture", colorSpace: "linear" },
  { field: "normalTexture", colorSpace: "linear" },
  { field: "detailNormalTexture", colorSpace: "linear" },
  { field: "occlusionTexture", colorSpace: "linear" },
  { field: "emissiveTexture", colorSpace: "srgb" },
  { field: "thicknessTexture", colorSpace: "linear" },
];

/**
 * Enumerate present baseColor, metalRough, normal, detailNormal, occlusion,
 * emissive and thickness bindings, the anisotropy direction binding, then
 * overlay color/normal bindings, carrying exact suffixes and decoding intent.
 */
export const materialTextureSlots: (
  material: IAutoMovieMaterial,
) => IAutoMovieMaterialTextureSlotsMaterialTextureSlot[] = (
  material: IAutoMovieMaterial,
): IAutoMovieMaterialTextureSlotsMaterialTextureSlot[] => {
  const slots: IAutoMovieMaterialTextureSlotsMaterialTextureSlot[] = [];
  const add: (
    path: string,
    binding: AutoMovieTextureBinding | null | undefined,
    colorSpace: "srgb" | "linear",
  ) => void = (
    path: string,
    binding: AutoMovieTextureBinding | null | undefined,
    colorSpace: "srgb" | "linear",
  ): void => {
    if (binding !== null && binding !== undefined)
      slots.push({ path, binding, colorSpace });
  };
  for (const slot of OWN_SLOTS)
    add(`.${slot.field}`, material[slot.field], slot.colorSpace);
  if (material.anisotropy !== undefined)
    add(".anisotropy.texture", material.anisotropy.texture, "linear");
  material.overlays?.forEach(
    (overlay: IAutoMovieMaterialOverlay, index: number): void => {
      add(
        `.overlays[${index}].baseColorTexture`,
        overlay.baseColorTexture,
        "srgb",
      );
      add(`.overlays[${index}].normalTexture`, overlay.normalTexture, "linear");
    },
  );
  return slots;
};
