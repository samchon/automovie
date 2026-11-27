/*
 * Admit the physical raster area against the caller's pixel budget.
 */
export function assertAutoMovieMetricRasterBudget(
  width: number,
  height: number,
  maxPixels: number,
): void {
  if (!(width >= 1 && height >= 1 && width * height <= maxPixels))
    throw new Error(
      "Metric capture requires positive bounded physical pixel dimensions and an explicit pass",
    );
}
