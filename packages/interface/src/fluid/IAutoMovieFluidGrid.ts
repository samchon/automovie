import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The fixed lattice a fluid domain is solved on.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `IAutoMovieFluidGrid` as the portable data boundary for the interior fluid volume level requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `IAutoMovieFluidGrid` for the interior space water feature fluid domain system contract.
 */
export interface IAutoMovieFluidGrid {
  /**
   * Cell count along `+x`; at least 1.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `columns` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `columns` for the interior space water feature fluid domain system contract.
   */
  columns: number;

  /**
   * Cell count along `+z`; at least 1.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `rows` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `rows` for the interior space water feature fluid domain system contract.
   */
  rows: number;

  /**
   * Cell size along `+x` in metres; strictly positive.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `cellX` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `cellX` for the interior space water feature fluid domain system contract.
   */
  cellX: number;

  /**
   * Cell size along `+z` in metres; strictly positive.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `cellZ` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `cellZ` for the interior space water feature fluid domain system contract.
   */
  cellZ: number;

  /**
   * World position of the lattice corner at `column = 0, row = 0`. `x`/`z` are
   * the minimum corner of that cell; `y` is the datum every `bed` value is
   * measured above.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `origin` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `origin` for the interior space water feature fluid domain system contract.
   */
  origin: IAutoMovieVector3;
}
