import { AutoMovieSurfacePatternGenerator } from "./AutoMovieSurfacePatternGenerator";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One area of the host face filled by one module program.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMovieSurfacePatternZone` represents one area of the host face filled by one module program. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMovieSurfacePatternZone` structures one area of the host face filled by one module program for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMovieSurfacePatternZone {
  /**
   * Stable zone id, unique inside one pattern.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `id` records `IAutoMovieSurfacePatternZone`'s stable zone id, unique inside one pattern. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `id` supplies `IAutoMovieSurfacePatternZone`'s stable zone id, unique inside one pattern when the engine resolves the declared physical-module pattern deterministically.
   */
  id: string;
  /**
   * Convex face-local polygon of at least three points.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `region` records `IAutoMovieSurfacePatternZone`'s convex face-local polygon of at least three points. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `region` supplies `IAutoMovieSurfacePatternZone`'s convex face-local polygon of at least three points when the engine resolves the declared physical-module pattern deterministically.
   */
  region: IAutoMoviePatternPoint[];
  /**
   * Face-local metre position of lattice cell `(0, 0)`.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `origin` records `IAutoMovieSurfacePatternZone`'s face-local metre position of lattice cell `(0, 0)`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `origin` supplies `IAutoMovieSurfacePatternZone`'s face-local metre position of lattice cell `(0, 0)` when the engine resolves the declared physical-module pattern deterministically.
   */
  origin: IAutoMoviePatternPoint;
  /**
   * Lattice pitch in metres; the generator runs once per cell.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `period` records `IAutoMovieSurfacePatternZone`'s lattice pitch in metres; the generator runs once per cell. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `period` supplies `IAutoMovieSurfacePatternZone`'s lattice pitch in metres; the generator runs once per cell when the engine resolves the declared physical-module pattern deterministically.
   */
  period: {
    /** Cell pitch along U, strictly above zero. */
    u: number;
    /** Cell pitch along V, strictly above zero. */
    v: number;
  };
  /**
   * How far in metres a generated module may reach from its cell origin.
   *
   * The lattice is enumerated wide enough that every cell whose modules could
   * touch the region is visited, which is only knowable if the author states
   * the reach. A module that exceeds it is refused rather than silently dropped
   * at the region's edge.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `reach` records how far in metres a generated module may reach from its cell origin for `IAutoMovieSurfacePatternZone`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `reach` tells the engine how far in metres a generated module may reach from its cell origin for `IAutoMovieSurfacePatternZone` as it resolves the declared physical-module pattern deterministically.
   */
  reach: {
    /** Greatest reach along U, strictly above zero. */
    u: number;
    /** Greatest reach along V, strictly above zero. */
    v: number;
  };
  /**
   * {@link IAutoMovieMaterial} id this zone's modules carry, or `null`.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `material` records `IAutoMovieSurfacePatternZone`'s `IAutoMovieMaterial` id this zone's modules carry, or `null`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `material` supplies `IAutoMovieSurfacePatternZone`'s `IAutoMovieMaterial` id this zone's modules carry, or `null` when the engine resolves the declared physical-module pattern deterministically.
   */
  material: string | null;
  /**
   * The author's module program for this zone.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `generate` records `IAutoMovieSurfacePatternZone`'s author's module program for this zone. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `generate` supplies `IAutoMovieSurfacePatternZone`'s author's module program for this zone when the engine resolves the declared physical-module pattern deterministically.
   */
  generate: AutoMovieSurfacePatternGenerator;
}
