import type { PNG } from "pngjs";

/**
 * Detect variation in decoded premultiplied RGBA values.
 *
 * @evidence contracts/common.md#principled-implementation Each pixel's RGB times alpha and alpha itself are compared with the first decoded pixel.
 * @evidence contracts/common.md#clear-and-simple-design Preview and subject inspection share this exact raster predicate rather than duplicating its arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Transparent RGB differences do not count; fewer than two pixels and uniform rasters refuse, but variation alone proves no subject visibility or scene correctness.
 * @evidence contracts/common.md#meaningful-documentation The input is decoded PNG data and the result is a raster predicate, not an observed GPU or clinical judgment.
 * @evidence contracts/performance.md#efficient-algorithms At most W times H pixels are scanned with fixed arithmetic and early return at the first differing pixel.
 * @evidence contracts/performance.md#reuse-equivalent-work The already decoded raster is reused; no second PNG decode or persistent image cache occurs here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only four first-pixel scalars and loop locals are owned; the input PNG remains borrowed and no buffer is retained.
 */
export function oracleServiceHasVisiblePixelVariance(
  png: PNG
): boolean {
  if (png.data.length < 8) return false;
  const alpha: number = png.data[3]!;
  const first: number[] = [
    png.data[0]! * alpha,
    png.data[1]! * alpha,
    png.data[2]! * alpha,
    alpha,
  ];
  for (let offset: number = 4; offset < png.data.length; offset += 4) {
    const currentAlpha: number = png.data[offset + 3]!;
    if (
      png.data[offset]! * currentAlpha !== first[0] ||
      png.data[offset + 1]! * currentAlpha !== first[1] ||
      png.data[offset + 2]! * currentAlpha !== first[2] ||
      currentAlpha !== first[3]
    )
      return true;
  }
  return false;
}
