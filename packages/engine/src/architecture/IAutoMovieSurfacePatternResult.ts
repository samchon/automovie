import { IAutoMoviePatternFinding } from "./IAutoMoviePatternFinding";
import { IAutoMoviePatternPlacement } from "./IAutoMoviePatternPlacement";
import { IAutoMoviePatternQuantities } from "./IAutoMoviePatternQuantities";

/**
 * Everything one deterministic pattern run produces.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMovieSurfacePatternResult` represents everything one deterministic pattern run produces. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMovieSurfacePatternResult` structures everything one deterministic pattern run produces for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMovieSurfacePatternResult {
  /**
   * The pattern that produced this run.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `id` records `IAutoMovieSurfacePatternResult`'s pattern that produced this run. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `id` supplies `IAutoMovieSurfacePatternResult`'s pattern that produced this run when the engine resolves the declared physical-module pattern deterministically.
   */
  id: string;
  /**
   * Occurrences in zone, row, column, then generator order.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `placements` records `IAutoMovieSurfacePatternResult`'s occurrences in zone, row, column, then generator order. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `placements` supplies `IAutoMovieSurfacePatternResult`'s occurrences in zone, row, column, then generator order when the engine resolves the declared physical-module pattern deterministically.
   */
  placements: IAutoMoviePatternPlacement[];
  /**
   * The take-off.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `quantities` records `IAutoMovieSurfacePatternResult`'s take-off. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `quantities` supplies `IAutoMovieSurfacePatternResult`'s take-off when the engine resolves the declared physical-module pattern deterministically.
   */
  quantities: IAutoMoviePatternQuantities;
  /**
   * Structured defects, per-occurrence ones first, then per-pair ones.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `findings` records `IAutoMovieSurfacePatternResult`'s structured defects, per-occurrence ones first, then per-pair ones. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `findings` supplies `IAutoMovieSurfacePatternResult`'s structured defects, per-occurrence ones first, then per-pair ones when the engine resolves the declared physical-module pattern deterministically.
   */
  findings: IAutoMoviePatternFinding[];
}
