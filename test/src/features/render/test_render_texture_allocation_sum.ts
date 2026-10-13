import { sumAutoMovieRenderTextureAllocations } from "@automovie/engine";
import type { IAutoMovieRenderTextureCost } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Native count aggregation preserves an unknown population and exact integer
 * boundaries. It has no renderer, context or texture-byte estimation behavior.
 *
 * Scenarios:
 *
 * 1. Empty, legacy, zero and aggregate attachment populations add exactly.
 * 2. Null, negative, fractional, nonfinite and unsafe values remain unknown.
 * 3. The exact safe boundary admits while adding one refuses instead of rounding.
 */
export const test_render_texture_allocation_sum = (): void => {
  const row = (allocations?: number | null): IAutoMovieRenderTextureCost => ({
    asset: null, materials: [], bytes: 0, allocations,
  });
  TestValidator.equals("empty allocation population", sumAutoMovieRenderTextureAllocations([]), 0);
  TestValidator.equals("legacy and aggregate count arithmetic", sumAutoMovieRenderTextureAllocations([row(), row(0), row(5)]), 1 + 0 + 5);
  TestValidator.equals("unknown is not the legacy default", sumAutoMovieRenderTextureAllocations([row(2), row(null)]), null);
  for (const count of [-1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1])
    TestValidator.equals("invalid native count is unbounded", sumAutoMovieRenderTextureAllocations([row(count)]), null);
  TestValidator.equals("exact safe count boundary", sumAutoMovieRenderTextureAllocations([row(Number.MAX_SAFE_INTEGER), row(0)]), Number.MAX_SAFE_INTEGER);
  TestValidator.equals("unsafe aggregate count is unbounded", sumAutoMovieRenderTextureAllocations([row(Number.MAX_SAFE_INTEGER), row(1)]), null);
};
