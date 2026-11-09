import type { IAutoMovieRenderTextureCost } from "@automovie/interface";

/**
 * Sum certified allocation populations without replacing unknown by one.
 * Omitted counts retain the legacy one-allocation row meaning. Invalid counts
 * and unsafe aggregate integers remain unbounded rather than rounded totals.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Sum each certified nonnegative safe allocation count, using the documented omitted-count legacy meaning of one; explicit null or unsafe aggregate returns null instead of certifying a rounded population.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This owner combines allocation cardinality separately from texture byte summation and leaves actual sharing authority with closure rows.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown counts are never replaced by one, and zero remains an admitted zero allocation count; no row id or expected budget changes summation.
 * @evidence contracts/development/common.md#meaningful-documentation Docs distinguish omitted legacy count, null unknown authority, safe integers and aggregate failure.
 * @evidence contracts/development/implementation.md#efficient-algorithms T rows need O(T) scalar work and O(1) auxiliary storage, returning early when any count is unknown/unsafe.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Inventory reuses the completed closure rows instead of recounting native objects; changed rows require a new sum with no persistent cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only one number/null escapes, with no texture row history, handle or background task retained.
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
    if (!Number.isSafeInteger(count) || count < 0) return null;
    sum += count;
    if (!Number.isSafeInteger(sum)) return null;
  }
  return sum;
};
