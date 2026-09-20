import { AutoMovieFluidBoundaryKind } from "./AutoMovieFluidBoundaryKind";

/**
 * Which lattice edge reflects and which lets water leave the domain.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `IAutoMovieFluidBoundaries` as the portable data boundary for the interior fluid volume level requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `IAutoMovieFluidBoundaries` for the interior space water feature fluid domain system contract.
 */
export interface IAutoMovieFluidBoundaries {
  /**
   * Edge at `column = 0`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `xMin` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `xMin` for the interior space water feature fluid domain system contract.
   */
  xMin: AutoMovieFluidBoundaryKind;

  /**
   * Edge past `column = columns - 1`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `xMax` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `xMax` for the interior space water feature fluid domain system contract.
   */
  xMax: AutoMovieFluidBoundaryKind;

  /**
   * Edge at `row = 0`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `zMin` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `zMin` for the interior space water feature fluid domain system contract.
   */
  zMin: AutoMovieFluidBoundaryKind;

  /**
   * Edge past `row = rows - 1`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-volume-level Exposes `zMax` as the portable data boundary for the interior fluid volume level requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `zMax` for the interior space water feature fluid domain system contract.
   */
  zMax: AutoMovieFluidBoundaryKind;
}
