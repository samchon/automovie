import {
  AutoMovieTextureBinding,
  IAutoMovieMaterial,
} from "@automovie/interface";

/** One image a material binds: where it sits and how its texels decode. */
interface IMaterialTextureSlot {
  /** Path under the material, such as `.normalTexture` or `.overlays[1].baseColorTexture`. */
  path: string;
  /** The binding as the material states it. */
  binding: AutoMovieTextureBinding;
  /**
   * The decoding the slot requires. A legacy bare-id binding declares no
   * intent, so the slot's own requirement is what it means: base colour and
   * emissive are radiometric colours stored in sRGB, and the data maps are
   * measurements that must not be gamma decoded.
   */
  colorSpace: "srgb" | "linear";
}

/** The material's own image slots, in glTF order, then the detail normal. */
const OWN_SLOTS: ReadonlyArray<{
  field:
    | "baseColorTexture"
    | "metallicRoughnessTexture"
    | "normalTexture"
    | "detailNormalTexture"
    | "occlusionTexture"
    | "emissiveTexture";
  colorSpace: "srgb" | "linear";
}> = [
  { field: "baseColorTexture", colorSpace: "srgb" },
  { field: "metallicRoughnessTexture", colorSpace: "linear" },
  { field: "normalTexture", colorSpace: "linear" },
  { field: "detailNormalTexture", colorSpace: "linear" },
  { field: "occlusionTexture", colorSpace: "linear" },
  { field: "emissiveTexture", colorSpace: "srgb" },
];

/**
 * Every image a material binds, its own slots and then each overlay's colour
 * and normal map, so validation, asset closure and the texture inventory
 * read one list rather than copies of it.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-surface-validation Lists every image slot a material binds, overlays included, with the decoding each requires.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-surface-visual Lists every image slot a material binds, overlays included, with the decoding each requires.
 */
export const materialTextureSlots = (
  material: IAutoMovieMaterial,
): IMaterialTextureSlot[] => {
  const slots: IMaterialTextureSlot[] = [];
  const add = (
    path: string,
    binding: AutoMovieTextureBinding | null | undefined,
    colorSpace: "srgb" | "linear",
  ): void => {
    if (binding !== null && binding !== undefined)
      slots.push({ path, binding, colorSpace });
  };
  for (const slot of OWN_SLOTS)
    add(`.${slot.field}`, material[slot.field], slot.colorSpace);
  // a record under validation may carry anything here; model validation
  // reports a malformed list or entry, and its images are listed as far as
  // they are there
  const overlays: unknown = material.overlays;
  if (Array.isArray(overlays))
    overlays.forEach((overlay: unknown, index) => {
      if (typeof overlay !== "object" || overlay === null) return;
      const { baseColorTexture, normalTexture } = overlay as Partial<
        NonNullable<IAutoMovieMaterial["overlays"]>[number]
      >;
      add(`.overlays[${index}].baseColorTexture`, baseColorTexture, "srgb");
      add(`.overlays[${index}].normalTexture`, normalTexture, "linear");
    });
  return slots;
};
