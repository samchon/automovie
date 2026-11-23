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
  const anisotropy: unknown = material.anisotropy;
  if (typeof anisotropy === "object" && anisotropy !== null)
    add(
      ".anisotropy.texture",
      (anisotropy as Partial<NonNullable<IAutoMovieMaterial["anisotropy"]>>)
        .texture,
      "linear",
    );
  // a record under validation may carry anything here; model validation
  // reports a malformed list or entry, and its images are listed as far as
  // they are there
  const overlays: unknown = material.overlays;
  if (Array.isArray(overlays))
    overlays.forEach((overlay: unknown, index: number): void => {
      if (typeof overlay !== "object" || overlay === null) return;
      const {
        baseColorTexture,
        normalTexture,
      }: Partial<IAutoMovieMaterialOverlay> = overlay as Partial<
        NonNullable<IAutoMovieMaterial["overlays"]>[number]
      >;
      add(`.overlays[${index}].baseColorTexture`, baseColorTexture, "srgb");
      add(`.overlays[${index}].normalTexture`, normalTexture, "linear");
    });
  return slots;
};
