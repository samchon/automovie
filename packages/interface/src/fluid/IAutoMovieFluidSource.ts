/**
 * One declared inflow into a single cell.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `IAutoMovieFluidSource` as the portable data boundary for the interior fluid volume level requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `IAutoMovieFluidSource` for the interior space water feature fluid domain system contract.
 */
export interface IAutoMovieFluidSource {
  /**
   * Stable source identity within the domain.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `id` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `id` for the interior space water feature fluid domain system contract.
   */
  id: string;

  /**
   * Cell column receiving the water; `0 <= column < grid.columns`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `column` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `column` for the interior space water feature fluid domain system contract.
   */
  column: number;

  /**
   * Cell row receiving the water; `0 <= row < grid.rows`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `row` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `row` for the interior space water feature fluid domain system contract.
   */
  row: number;

  /**
   * Volumetric inflow in m³/s; must be `>= 0`. Use a drain to remove water.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `flowRate` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `flowRate` for the interior space water feature fluid domain system contract.
   */
  flowRate: number;

  /**
   * Domain-clock second at which the source starts; finite and `>= 0`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `start` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `start` for the interior space water feature fluid domain system contract.
   */
  start: number;

  /**
   * Domain-clock second at which it stops, or `null` for "never".
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `end` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `end` for the interior space water feature fluid domain system contract.
   */
  end: number | null;
}
