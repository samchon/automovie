/**
 * One zone's share of the take-off.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMoviePatternZoneQuantities` represents one zone's share of the take-off. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMoviePatternZoneQuantities` structures one zone's share of the take-off for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMoviePatternZoneQuantities {
  /**
   * The zone id.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `zone` records `IAutoMoviePatternZoneQuantities`'s zone id. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `zone` supplies `IAutoMoviePatternZoneQuantities`'s zone id when the engine resolves the declared physical-module pattern deterministically.
   */
  zone: string;
  /**
   * Placed occurrences in this zone.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `modules` records `IAutoMoviePatternZoneQuantities`'s placed occurrences in this zone. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `modules` supplies `IAutoMoviePatternZoneQuantities`'s placed occurrences in this zone when the engine resolves the declared physical-module pattern deterministically.
   */
  modules: number;
  /**
   * Occurrences laid whole in this zone.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `whole` records `IAutoMoviePatternZoneQuantities`'s occurrences laid whole in this zone. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `whole` supplies `IAutoMoviePatternZoneQuantities`'s occurrences laid whole in this zone when the engine resolves the declared physical-module pattern deterministically.
   */
  whole: number;
  /**
   * Occurrences reduced in this zone.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `cut` records `IAutoMoviePatternZoneQuantities`'s occurrences reduced in this zone. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `cut` supplies `IAutoMoviePatternZoneQuantities`'s occurrences reduced in this zone when the engine resolves the declared physical-module pattern deterministically.
   */
  cut: number;
  /**
   * Surviving area laid in this zone, in square metres.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `coveredArea` records `IAutoMoviePatternZoneQuantities`'s surviving area laid in this zone, in square metres. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `coveredArea` supplies `IAutoMoviePatternZoneQuantities`'s surviving area laid in this zone, in square metres when the engine resolves the declared physical-module pattern deterministically.
   */
  coveredArea: number;
  /**
   * Full modules consumed in this zone, in square metres.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `consumedArea` records `IAutoMoviePatternZoneQuantities`'s full modules consumed in this zone, in square metres. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `consumedArea` supplies `IAutoMoviePatternZoneQuantities`'s full modules consumed in this zone, in square metres when the engine resolves the declared physical-module pattern deterministically.
   */
  consumedArea: number;
  /**
   * Offcut area in this zone, in square metres.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `wasteArea` records `IAutoMoviePatternZoneQuantities`'s offcut area in this zone, in square metres. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `wasteArea` supplies `IAutoMoviePatternZoneQuantities`'s offcut area in this zone, in square metres when the engine resolves the declared physical-module pattern deterministically.
   */
  wasteArea: number;
  /**
   * This zone's region area net of exclusions, in square metres.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `netRegionArea` records `IAutoMoviePatternZoneQuantities`'s this zone's region area net of exclusions, in square metres. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `netRegionArea` supplies `IAutoMoviePatternZoneQuantities`'s this zone's region area net of exclusions, in square metres when the engine resolves the declared physical-module pattern deterministically.
   */
  netRegionArea: number;
}
