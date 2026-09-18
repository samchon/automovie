import { IAutoMovieSurface } from "../scene/IAutoMovieSurface";

/**
 * A support surface and the logical space in which it can be used.
 *
 * @evidence requirements/interior/surface-assemblies.md#interior-surface-substance-product Exposes `IAutoMovieBuiltSurface` as the portable data boundary for the interior surface substance product requirement.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region Types `IAutoMovieBuiltSurface` for the interior space surface assembly region system contract.
 */
export interface IAutoMovieBuiltSurface {
  /**
   * Logical space containing the support patch.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-substance-product Exposes `space` as the portable data boundary for the interior surface substance product requirement.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region Types `space` for the interior space surface assembly region system contract.
   */
  space: string;
  /**
   * Existing deterministic support/height representation.
   *
   * @evidence requirements/interior/surface-assemblies.md#interior-surface-substance-product Exposes `surface` as the portable data boundary for the interior surface substance product requirement.
   * @evidence specifications/interior-space/surface-assemblies.md#interior-space-surface-assembly-region Types `surface` for the interior space surface assembly region system contract.
   */
  surface: IAutoMovieSurface;
}
