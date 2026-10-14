import type { IAutoMovieMaterial } from "@automovie/interface";

/**
 * Construct the portrait eye's supplied-thickness corneal finish.
 *
 * Each portrait eye supplies a distinct material identity and its own full
 * shell thickness in metres. The fixed
 * white dielectric, roughness 0.035, transmission 1 and IOR 1.376 preserve the
 * portrait renderer's existing convention. They do not infer an individual's
 * refractive index or predict a clinically observed entrance pupil. Thickness
 * comes only from that eye's supplied dimensions, never from this convention.
 * The returned material owns its colour; no shared mutable finish is retained.
 *
 * @evidence contracts/common.md#principled-implementation One declared white transmissive dielectric finish uses the actual supplied metric shell thickness.
 * @evidence contracts/common.md#clear-and-simple-design CreatePortraitEyeComponent supplies each eye's distinct material identity and thickness to this rendering owner; source-registered optical finishes remain owned by createHumanFaceOpticalFinish.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed roughness and IOR are renderer conventions rather than inferred individual reflectance or clinical pupil prediction.
 * @evidence contracts/common.md#meaningful-documentation The prose gives metre thickness, copied colour ownership, material identity admission and optical interpretation limits.
 * @evidence contracts/performance.md#efficient-algorithms Identity admission trims the caller's ID, so validation scales with its length; thickness checks and material/colour record construction use fixed work. The supplied name is retained without traversal or validation.
 * @evidence contracts/performance.md#reuse-equivalent-work Both portrait eyes reuse this rendering owner with their own supplied shell dimensions and fresh colour records; it retains no material cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the new material/colour; no geometry, cache, handle or task is retained.
 */
export function createHumanFaceCornealMaterial(
  id: string,
  name: string,
  thicknessMetres: number,
): IAutoMovieMaterial {
  if (
    id.trim() === "" ||
    !Number.isFinite(thicknessMetres) ||
    thicknessMetres <= 0
  )
    throw new Error(
      "Corneal rendering needs a material identity and supplied positive metric thickness.",
    );
  return {
    id,
    name,
    baseColor: { r: 1, g: 1, b: 1, a: 1, hex: null },
    roughness: 0.035,
    metallic: 0,
    opacity: 1,
    emissive: null,
    baseColorTexture: null,
    doubleSided: true,
    transmission: 1,
    ior: 1.376,
    thickness: thicknessMetres,
  };
}
