import { srgbHexToLinearColor } from "@automovie/engine";
import type { IAutoMovieMaterial } from "@automovie/interface";

/** Native response shared by the finish owners */
export function materialFinish(
  id: string,
  color: string,
  roughness: number,
  overrides: Partial<Pick<IAutoMovieMaterial, "metallic" | "opacity" | "alphaMode" | "doubleSided" | "transmission" | "emissive" | "thickness" | "clearcoat" | "ior" | "baseColorTexture">> = {},
): IAutoMovieMaterial {
  if (!Number.isFinite(roughness) || roughness < 0 || roughness > 1)
    throw new Error(`${id}: roughness must be in [0, 1]`);
  for (const key of ["metallic", "opacity", "transmission", "clearcoat"] as const) {
    const value = overrides[key];
    if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 1))
      throw new Error(`${id}: ${key} must be in [0, 1]`);
  }
  for (const [key, minimum] of [["ior", 1], ["thickness", 0]] as const) {
    const value = overrides[key];
    if (value !== undefined && (!Number.isFinite(value) || value < minimum))
      throw new Error(`${id}: ${key} must be finite and >= ${minimum}`);
  }
  return {
    id,
    name: id,
    baseColor: srgbHexToLinearColor(color),
    roughness,
    metallic: 0,
    opacity: 1,
    alphaMode: "opaque",
    doubleSided: false,
    transmission: 0,
    emissive: null,
    thickness: 0,
    clearcoat: 0,
    ior: 1.5,
    baseColorTexture: null,
    ...overrides,
  };
}

