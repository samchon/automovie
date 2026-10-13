import type { IAutoMovieRenderTextureCost } from "@automovie/interface";

/**
 * Sum certified allocation populations without replacing unknown by one.
 * Omitted counts retain the legacy one-allocation row meaning. Invalid counts
 * and unsafe aggregate integers remain unbounded rather than rounded totals.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Preserves unknown and unsafe texture cardinality beside byte uncertainty.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Supplies the inventory's count boundary without inventing a native allocation population.
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
