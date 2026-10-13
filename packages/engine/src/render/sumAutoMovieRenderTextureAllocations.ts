import type { IAutoMovieRenderTextureCost } from "@automovie/interface";

/**
 * Sum certified allocation populations without replacing unknown by one.
 * Omitted counts retain the legacy one-allocation row meaning. Invalid counts
 * and unsafe aggregate integers remain unbounded rather than rounded totals.
 */
export const sumAutoMovieRenderTextureAllocations = (
  textures: readonly IAutoMovieRenderTextureCost[],
): number | null => {
  let sum = 0;
  for (const texture of textures) {
    if (texture.allocations === null) return null;
    const count = texture.allocations ?? 1;
    if (!Number.isSafeInteger(count) || count < 0) return null;
    sum += count;
    if (!Number.isSafeInteger(sum)) return null;
  }
  return sum;
};
