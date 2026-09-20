import { IAutoMoviePatternExclusion } from "./IAutoMoviePatternExclusion";
import { IAutoMovieSurfacePatternZone } from "./IAutoMovieSurfacePatternZone";

/**
 * A deterministic module-laying program over one host face.
 *
 * Tiles, bricks, stone slabs, boards, panels, and repeated ornament are not a
 * texture repeat. A texture repeat knows nothing about the real module size,
 * the joint between modules, the piece cut at a boundary, the opening the
 * pattern has to step around, or how many modules were consumed and how much of
 * them was thrown away. This record is the program that does: the author writes
 * the module law per zone, and the engine owns the parts that must be identical
 * every run — clipping, exclusion, cut classification, neighbour measurement,
 * seeded variation, and the take-off.
 *
 * Several zones in one pattern is how a transition is expressed: each zone lays
 * its own modules inside its own region, and the neighbour scan then measures
 * across the border between them exactly as it does inside one zone, so a grain
 * that turns or a joint that fails to line up at the transition is reported
 * with both occurrence ids rather than being invisible.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMovieSurfacePattern` represents a deterministic module-laying program over one host face. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMovieSurfacePattern` structures a deterministic module-laying program over one host face for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMovieSurfacePattern {
  /**
   * Stable pattern id.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `id` records `IAutoMovieSurfacePattern`'s stable pattern id. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `id` supplies `IAutoMovieSurfacePattern`'s stable pattern id when the engine resolves the declared physical-module pattern deterministically.
   */
  id: string;
  /**
   * Areas of the face, each with its own module program. Never empty.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `zones` records `IAutoMovieSurfacePattern`'s areas of the face, each with its own module program. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `zones` supplies `IAutoMovieSurfacePattern`'s areas of the face, each with its own module program when the engine resolves the declared physical-module pattern deterministically.
   */
  zones: IAutoMovieSurfacePatternZone[];
  /**
   * Areas no module may cover, such as an opening or a drain.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `exclusions` records `IAutoMovieSurfacePattern`'s areas no module may cover, such as an opening or a drain. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `exclusions` supplies `IAutoMovieSurfacePattern`'s areas no module may cover, such as an opening or a drain when the engine resolves the declared physical-module pattern deterministically.
   */
  exclusions: IAutoMoviePatternExclusion[];
  /**
   * Nominal gap between neighbouring laid pieces in metres, at least zero.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `joint` records `IAutoMovieSurfacePattern`'s nominal gap between neighbouring laid pieces in metres, at least zero. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `joint` supplies `IAutoMovieSurfacePattern`'s nominal gap between neighbouring laid pieces in metres, at least zero when the engine resolves the declared physical-module pattern deterministically.
   */
  joint: number;
  /**
   * Metre slack a measured gap may differ from the nominal joint by.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `jointTolerance` records `IAutoMovieSurfacePattern`'s metre slack a measured gap may differ from the nominal joint by. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `jointTolerance` supplies `IAutoMovieSurfacePattern`'s metre slack a measured gap may differ from the nominal joint by when the engine resolves the declared physical-module pattern deterministically.
   */
  jointTolerance: number;
  /**
   * Greatest metre gap at which two laid pieces still count as neighbours.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `adjacency` records `IAutoMovieSurfacePattern`'s greatest metre gap at which two laid pieces still count as neighbours. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `adjacency` supplies `IAutoMovieSurfacePattern`'s greatest metre gap at which two laid pieces still count as neighbours when the engine resolves the declared physical-module pattern deterministically.
   */
  adjacency: number;
  /**
   * Smallest acceptable surviving fraction of a module, within `(0, 1]`.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `minimumPiece` records `IAutoMovieSurfacePattern`'s smallest acceptable surviving fraction of a module, within `(0, 1]`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `minimumPiece` supplies `IAutoMovieSurfacePattern`'s smallest acceptable surviving fraction of a module, within `(0, 1]` when the engine resolves the declared physical-module pattern deterministically.
   */
  minimumPiece: number;
  /**
   * Greatest tolerated grain deviation between neighbours in degrees, or
   * `null`.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `grainToleranceDeg` records `IAutoMovieSurfacePattern`'s greatest tolerated grain deviation between neighbours in degrees, or `null`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `grainToleranceDeg` supplies `IAutoMovieSurfacePattern`'s greatest tolerated grain deviation between neighbours in degrees, or `null` when the engine resolves the declared physical-module pattern deterministically.
   */
  grainToleranceDeg: number | null;
  /**
   * Non-negative safe-integer seed driving every variant draw.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `seed` records `IAutoMovieSurfacePattern`'s non-negative safe-integer seed driving every variant draw. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `seed` supplies `IAutoMovieSurfacePattern`'s non-negative safe-integer seed driving every variant draw when the engine resolves the declared physical-module pattern deterministically.
   */
  seed: number;
  /**
   * Positive integer count of variants the seed may choose between.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `variants` records `IAutoMovieSurfacePattern`'s positive integer count of variants the seed may choose between. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `variants` supplies `IAutoMovieSurfacePattern`'s positive integer count of variants the seed may choose between when the engine resolves the declared physical-module pattern deterministically.
   */
  variants: number;
}
