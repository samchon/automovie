import type { IAutoMovieMaterial } from "@automovie/interface";

/**
 * Own the established corneal rendering law for both optical consumers.
 *
 * The portrait eye and source-registered numerical eye each supply a distinct
 * material identity and their own full shell thickness in metres. The fixed
 * white dielectric, roughness 0.035, transmission 1 and IOR 1.376 preserve the
 * portrait renderer's existing convention. They do not infer an individual's
 * refractive index or predict a clinically observed entrance pupil. Thickness
 * comes only from that eye's supplied dimensions, never from this convention.
 * The returned material owns its colour; no shared mutable finish is retained.
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
