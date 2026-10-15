import type { IAutoMovieTextureReference } from "@automovie/interface";

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
