import type { IAutoMovieRenderTextureCost } from "@automovie/interface";

/**
 * Sum certified allocation populations without replacing unknown by one.
 * Omitted counts retain the legacy one-allocation row meaning. Invalid counts
 * and unsafe aggregate integers remain unbounded rather than rounded totals.
 */
export const sumAutoMovieRenderTextureAllocations: (
  textures: readonly IAutoMovieRenderTextureCost[],
) => number | null = (
  textures: readonly IAutoMovieRenderTextureCost[],
): number | null => {
  let sum: number = 0;
  for (const texture of textures) {
    if (texture.allocations === null) return null;
    const count: number = texture.allocations ?? 1;
    if (count < 0) return null;
    sum += count;
    if (sum > Number.MAX_SAFE_INTEGER) return null;
  }
  return sum;
};
