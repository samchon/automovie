/**
 * The bounded cost a fluid domain adds to a shot, for the builder report.
 *
 * Every field is derived from the domain record alone, so a production can be
 * refused for an unaffordable water feature before a single step is
 * integrated.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `IAutoMovieFluidBudget` as the portable data boundary for the interior fluid initial boundary record requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `IAutoMovieFluidBudget` for the interior space water feature fluid domain system contract.
 */
export interface IAutoMovieFluidBudget {
  /**
   * Identity of the measured domain.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `domain` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `domain` for the interior space water feature fluid domain system contract.
   */
  domain: string;

  /**
   * Lattice cells, `columns * rows`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `cells` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `cells` for the interior space water feature fluid domain system contract.
   */
  cells: number;

  /**
   * Velocity faces, `(columns + 1) * rows + columns * (rows + 1)`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `faces` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `faces` for the interior space water feature fluid domain system contract.
   */
  faces: number;

  /**
   * Bytes one state occupies as 64-bit reals: `8 * (cells + faces)`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `stateBytes` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `stateBytes` for the interior space water feature fluid domain system contract.
   */
  stateBytes: number;

  /**
   * Highest absolute step a sample may integrate to.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `maxSteps` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `maxSteps` for the interior space water feature fluid domain system contract.
   */
  maxSteps: number;

  /**
   * Cell updates a worst-case seek costs, `cells * maxSteps`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `worstCaseCellUpdates` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `worstCaseCellUpdates` for the interior space water feature fluid domain system contract.
   */
  worstCaseCellUpdates: number;

  /**
   * Sum of every emitter's hard particle cap.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `sprayParticleCap` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `sprayParticleCap` for the interior space water feature fluid domain system contract.
   */
  sprayParticleCap: number;

  /**
   * Courant number `dt * sqrt(g * referenceDepth) * sqrt(1/dx² + 1/dz²)`. At
   * most `1` for a stable explicit solve.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `courant` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `courant` for the interior space water feature fluid domain system contract.
   */
  courant: number;
}
