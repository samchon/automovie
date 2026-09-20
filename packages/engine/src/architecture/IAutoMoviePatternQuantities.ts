import { IAutoMoviePatternZoneQuantities } from "./IAutoMoviePatternZoneQuantities";

/**
 * The take-off one pattern run produces.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMoviePatternQuantities` represents the take-off one pattern run produces. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMoviePatternQuantities` structures the take-off one pattern run produces for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMoviePatternQuantities {
  /**
   * Placed occurrences.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `modules` records `IAutoMoviePatternQuantities`'s placed occurrences. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `modules` supplies `IAutoMoviePatternQuantities`'s placed occurrences when the engine resolves the declared physical-module pattern deterministically.
   */
  modules: number;
  /**
   * Occurrences laid whole.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `whole` records `IAutoMoviePatternQuantities`'s occurrences laid whole. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `whole` supplies `IAutoMoviePatternQuantities`'s occurrences laid whole when the engine resolves the declared physical-module pattern deterministically.
   */
  whole: number;
  /**
   * Occurrences reduced by a boundary or an exclusion.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `cut` records `IAutoMoviePatternQuantities`'s occurrences reduced by a boundary or an exclusion. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `cut` supplies `IAutoMoviePatternQuantities`'s occurrences reduced by a boundary or an exclusion when the engine resolves the declared physical-module pattern deterministically.
   */
  cut: number;
  /**
   * Surviving area laid, in square metres.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `coveredArea` records `IAutoMoviePatternQuantities`'s surviving area laid, in square metres. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `coveredArea` supplies `IAutoMoviePatternQuantities`'s surviving area laid, in square metres when the engine resolves the declared physical-module pattern deterministically.
   */
  coveredArea: number;
  /**
   * Full modules consumed, in square metres; a cut piece still costs one.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `consumedArea` records `IAutoMoviePatternQuantities`'s full modules consumed, in square metres; a cut piece still costs one. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `consumedArea` supplies `IAutoMoviePatternQuantities`'s full modules consumed, in square metres; a cut piece still costs one when the engine resolves the declared physical-module pattern deterministically.
   */
  consumedArea: number;
  /**
   * Offcut area, in square metres.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `wasteArea` records `IAutoMoviePatternQuantities`'s offcut area, in square metres. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `wasteArea` supplies `IAutoMoviePatternQuantities`'s offcut area, in square metres when the engine resolves the declared physical-module pattern deterministically.
   */
  wasteArea: number;
  /**
   * Offcut share of what was consumed, within `[0, 1)`.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `wasteRatio` records `IAutoMoviePatternQuantities`'s offcut share of what was consumed, within `[0, 1)`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `wasteRatio` supplies `IAutoMoviePatternQuantities`'s offcut share of what was consumed, within `[0, 1)` when the engine resolves the declared physical-module pattern deterministically.
   */
  wasteRatio: number;
  /**
   * Zone area net of exclusions, in square metres.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `netRegionArea` records `IAutoMoviePatternQuantities`'s zone area net of exclusions, in square metres. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `netRegionArea` supplies `IAutoMoviePatternQuantities`'s zone area net of exclusions, in square metres when the engine resolves the declared physical-module pattern deterministically.
   */
  netRegionArea: number;
  /**
   * Net region area left uncovered by modules, in square metres.
   *
   * Negative states that the pieces cover more than the region has, which only
   * happens when they overlap each other; the overlap findings name the pairs.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `jointArea` records `IAutoMoviePatternQuantities`'s net region area left uncovered by modules, in square metres. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `jointArea` supplies `IAutoMoviePatternQuantities`'s net region area left uncovered by modules, in square metres when the engine resolves the declared physical-module pattern deterministically.
   */
  jointArea: number;
  /**
   * Joint area divided by the nominal joint width, in metres; zero when the
   * joint is zero.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `jointLength` records `IAutoMoviePatternQuantities`'s joint area divided by the nominal joint width, in metres; zero when the joint is zero. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `jointLength` supplies `IAutoMoviePatternQuantities`'s joint area divided by the nominal joint width, in metres; zero when the joint is zero when the engine resolves the declared physical-module pattern deterministically.
   */
  jointLength: number;
  /**
   * The same figures per zone, in declaration order.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `zones` records `IAutoMoviePatternQuantities`'s same figures per zone, in declaration order. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `zones` supplies `IAutoMoviePatternQuantities`'s same figures per zone, in declaration order when the engine resolves the declared physical-module pattern deterministically.
   */
  zones: IAutoMoviePatternZoneQuantities[];
}
