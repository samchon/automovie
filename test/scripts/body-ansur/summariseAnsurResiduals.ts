/** Mean and population standard deviation of the residuals in one stratum band. */
export interface IAnsurResidualBand {
  count: number;
  mean: number;
  sd: number;
}

/**
 * Summarise model-minus-person residuals per equal-count band of the ordering
 * quantity (thin to heavy).
 *
 * `residuals` arrive already ordered by the quantity, as `pickAnsurStrata`
 * returns them, and are cut into `bands` consecutive runs whose sizes differ
 * by at most one. A band reports the signed mean (a bias that depends on body
 * mass shows as a trend across bands) and the population standard deviation
 * (the scatter a bias correction cannot remove). Units are the residuals' own;
 * no value is rescaled. Zero bands, more bands than residuals, or a non-finite
 * residual are refused.
 */
export function summariseAnsurResiduals(
  residuals: readonly number[],
  bands: number,
): IAnsurResidualBand[] {
  if (!Number.isInteger(bands) || bands < 1 || bands > residuals.length)
    throw new Error(`Bands lie in [1, ${residuals.length}]: ${bands}`);
  if (residuals.some((value) => !Number.isFinite(value)))
    throw new Error("A residual must be finite.");
  return Array.from({ length: bands }, (_, band) => {
    const start = Math.floor((band * residuals.length) / bands);
    const end = Math.floor(((band + 1) * residuals.length) / bands);
    const run = residuals.slice(start, end);
    const mean = run.reduce((sum, value) => sum + value, 0) / run.length;
    const variance =
      run.reduce((sum, value) => sum + (value - mean) ** 2, 0) / run.length;
    return { count: run.length, mean, sd: Math.sqrt(variance) };
  });
}
