import { srgbHexToLinearColor } from "@automovie/engine";
import type { IAutoMovieMaterial, IAutoMovieTextureReference } from "@automovie/interface";

/** Native response shared by the finish owners in docs/materials/001-binding-and-scale.md. */
export function materialFinish(
  id: string,
  color: string,
  roughness: number,
  overrides: Partial<Pick<IAutoMovieMaterial, "metallic" | "opacity" | "alphaMode" | "doubleSided" | "transmission" | "emissive" | "thickness" | "clearcoat" | "ior" | "baseColorTexture">> = {},
): IAutoMovieMaterial {
  if (!Number.isFinite(roughness) || roughness < 0 || roughness > 1)
    throw new Error(`${id}: roughness must be in [0, 1]`);
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

/** One image turn per authored surface length in metres. */
export function metricBinding(asset: string, tileU: number, tileV: number): IAutoMovieTextureReference {
  if (!Number.isFinite(tileU) || !Number.isFinite(tileV) || tileU <= 0 || tileV <= 0)
    throw new Error(`${asset}: texture tile lengths must be positive finite metres`);
  return {
    asset,
    texCoord: 0,
    coordinateSource: "surface-metres",
    colorSpace: "srgb",
    transform: { offset: { x: 0, y: 0 }, scale: { x: 1 / tileU, y: 1 / tileV }, rotationDeg: 0 },
    sampler: { wrapS: "repeat", wrapT: "repeat", minFilter: "linearMipmapLinear", magFilter: "linear" },
  };
}
