import {
  AutoMovieTextureBinding,
  IAutoMovieMaterial,
  IAutoMovieMaterialOverlay,
} from "@automovie/interface";

/**
 * Represent one borrowed image binding with its material-relative path and required decoding.
 *
 * One row joins slot enumeration to binding/asset/scale consumers.
 *
 * The row is metadata, not a loaded or admitted texture.
 *
 * Path suffix, borrowed binding and srgb/linear meanings are documented.
 *
 * Each row has fixed fields; binding/string population drives retained bytes.
 *
 * All material texture consumers reuse this common row representation.
 *
 * The enumeration caller owns wrappers and the material owns referenced binding data.
 *
 * @author Samchon
 */
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

/** Own-slot order: base color, metallic-roughness, normal, detail normal, occlusion, then emissive. */
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
 * Enumerate present baseColor, metalRough, normal, detailNormal, occlusion and emissive bindings, then overlay color/normal bindings, carrying exact suffixes and decoding intent.
 *
 * @evidence contracts/common.md#principled-implementation Enumerate present baseColor, metalRough, normal, detailNormal, occlusion and emissive bindings, then overlay color/normal bindings, carrying exact suffixes and decoding intent.
 * @evidence contracts/common.md#clear-and-simple-design A single slot catalog feeds model, scale and ledger validators instead of independent path menus.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent bindings are skipped; malformed bindings are not repaired, and overlay record admission belongs to the material validator.
 * @evidence contracts/common.md#meaningful-documentation Rows carry borrowed bindings, caller-relative paths and srgb/linear intent in table order.
 * @evidence contracts/performance.md#efficient-algorithms Fixed own slots plus O(O) overlays produce O(T) fresh slot wrappers.
 * @evidence contracts/performance.md#reuse-equivalent-work All texture consumers share this catalog; changed material contents are enumerated anew.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns wrappers while the material owns borrowed bindings; no texture bytes or GPU handles are retained.
 */
export const materialTextureSlots: (
  material: IAutoMovieMaterial,
) => IMaterialTextureSlot[] = (
  material: IAutoMovieMaterial,
): IMaterialTextureSlot[] => {
  const slots: IMaterialTextureSlot[] = [];
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
