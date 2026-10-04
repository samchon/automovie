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
 *
 * @evidence contracts/common.md#principled-implementation Two geometry consumers share one rendering-law owner while retaining independent material identities and supplied metric thickness.
 * @evidence contracts/common.md#clear-and-simple-design One pure material constructor, without a cache or population record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometry dimension or patient-specific optical coefficient is filled from a mean.
 * @evidence contracts/common.md#meaningful-documentation States the fixed rendering convention, per-eye thickness and clinical limits.
 * @evidence contracts/modeling.md#spatial-conventions The supplied transmission thickness is metres; other coefficients are dimensionless renderer inputs.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The eye producer owns displayed part identity; this function emits a finish.
 * @evidenceExclude contracts/modeling.md#parameter-channels The dimension record owns corneal thickness and the source materials own colour overrides.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no mesh.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The shared profile owns the physical limbal surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled consumers own observation of their cornea.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Retains an existing rendering convention, without supplying a measured individual optical property.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits only finite positive shell thickness, not a clinical interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Introduces no independent anatomical input.
 */
export function createHumanFaceCornealMaterial(
  id: string,
  name: string,
  thicknessMetres: number,
): IAutoMovieMaterial {
  if (id.trim() === "" || !Number.isFinite(thicknessMetres) || thicknessMetres <= 0)
    throw new Error("Corneal rendering needs a material identity and supplied positive metric thickness.");
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
