/**
 * One declared outflow from a single cell.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `IAutoMovieFluidDrain` as the portable data boundary for the interior fluid volume level requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `IAutoMovieFluidDrain` for the interior space water feature fluid domain system contract.
 */
export interface IAutoMovieFluidDrain {
  /**
   * Stable drain identity within the domain.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `id` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `id` for the interior space water feature fluid domain system contract.
   */
  id: string;

  /**
   * Cell column the water leaves from; `0 <= column < grid.columns`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `column` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `column` for the interior space water feature fluid domain system contract.
   */
  column: number;

  /**
   * Cell row the water leaves from; `0 <= row < grid.rows`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `row` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `row` for the interior space water feature fluid domain system contract.
   */
  row: number;

  /**
   * Maximum volumetric outflow in m³/s; must be `>= 0`. The realized rate is
   * limited by the water actually available in the cell during the step.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `flowRate` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `flowRate` for the interior space water feature fluid domain system contract.
   */
  flowRate: number;

  /**
   * Free-surface elevation in metres above `grid.origin.y` below which the
   * drain is closed: the sill of an overflow weir, or the bed elevation for a
   * plain floor drain.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `sillLevel` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `sillLevel` for the interior space water feature fluid domain system contract.
   */
  sillLevel: number;

  /**
   * Domain-clock second at which the drain opens; finite and `>= 0`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `start` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `start` for the interior space water feature fluid domain system contract.
   */
  start: number;

  /**
   * Domain-clock second at which it closes, or `null` for "never".
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `end` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `end` for the interior space water feature fluid domain system contract.
   */
  end: number | null;
}
