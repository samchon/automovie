/**
 * Fixed-step integration settings and the budgets validation enforces.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `IAutoMovieFluidSolver` as the portable data boundary for the interior fluid volume level requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `IAutoMovieFluidSolver` for the interior space water feature fluid domain system contract.
 */
export interface IAutoMovieFluidSolver {
  /**
   * Integration step in seconds; strictly positive.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `fixedStepSeconds` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `fixedStepSeconds` for the interior space water feature fluid domain system contract.
   */
  fixedStepSeconds: number;

  /**
   * Gravity magnitude in m/s²; strictly positive (Earth is `9.81`).
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `gravity` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `gravity` for the interior space water feature fluid domain system contract.
   */
  gravity: number;

  /**
   * Linear drag in 1/s applied implicitly to face velocity, which is how a
   * shallow basin loses momentum to its floor. `0` is frictionless.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `drag` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `drag` for the interior space water feature fluid domain system contract.
   */
  drag: number;

  /**
   * Depth in metres at or below which a cell counts as dry, so no water is
   * pushed uphill onto land it cannot reach. `0` still refuses flow out of an
   * empty cell; a small positive value also suppresses film-thin sloshing.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `dryDepth` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `dryDepth` for the interior space water feature fluid domain system contract.
   */
  dryDepth: number;

  /**
   * The deepest water this domain is designed for, in metres, strictly
   * positive. It is the depth the Courant condition is checked against, and no
   * initial depth may exceed it.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `referenceDepth` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `referenceDepth` for the interior space water feature fluid domain system contract.
   */
  referenceDepth: number;

  /**
   * Highest absolute step index a sample may integrate to. It bounds the work
   * one seek can cost, so a shot cannot silently ask for an unbounded solve.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `maxSteps` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `maxSteps` for the interior space water feature fluid domain system contract.
   */
  maxSteps: number;
}
