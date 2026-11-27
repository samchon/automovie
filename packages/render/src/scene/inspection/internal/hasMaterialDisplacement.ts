import type { Material, Texture } from "three";

/*
 * Whether the material has a displacement texture assigned.
 */
export function hasMaterialDisplacement(
  material: IMaterialWithDisplacement,
): boolean {
  return (material.displacementMap ?? null) !== null;
}

/*
 * Material fields read by the inspection displacement check.
 */
interface IMaterialWithDisplacement extends Material {
  /*
   * The displacement texture, when the material has one.
   */
  readonly displacementMap?: Texture | null;
}
