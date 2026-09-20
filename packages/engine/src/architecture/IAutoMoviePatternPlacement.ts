import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One laid module occurrence: the identity geometry, finish, and take-off
 * share.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMoviePatternPlacement` represents one laid module occurrence: the identity geometry, finish, and take-off share. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMoviePatternPlacement` structures one laid module occurrence: the identity geometry, finish, and take-off share for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMoviePatternPlacement {
  /**
   * Occurrence identity, `"<zone>/<module>"`.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `id` records `IAutoMoviePatternPlacement`'s occurrence identity, `"<zone>/<module>"`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `id` supplies `IAutoMoviePatternPlacement`'s occurrence identity, `"<zone>/<module>"` when the engine resolves the declared physical-module pattern deterministically.
   */
  id: string;
  /**
   * The zone that laid it.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `zone` records `IAutoMoviePatternPlacement`'s zone that laid it. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `zone` supplies `IAutoMoviePatternPlacement`'s zone that laid it when the engine resolves the declared physical-module pattern deterministically.
   */
  zone: string;
  /**
   * The generator's own module id inside that zone.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `module` records `IAutoMoviePatternPlacement`'s generator's own module id inside that zone. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `module` supplies `IAutoMoviePatternPlacement`'s generator's own module id inside that zone when the engine resolves the declared physical-module pattern deterministically.
   */
  module: string;
  /**
   * Surface material id inherited from the zone, or `null`.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `material` records `IAutoMoviePatternPlacement`'s surface material id inherited from the zone, or `null`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `material` supplies `IAutoMoviePatternPlacement`'s surface material id inherited from the zone, or `null` when the engine resolves the declared physical-module pattern deterministically.
   */
  material: string | null;
  /**
   * Module centre in face-local metres, as generated.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `center` records `IAutoMoviePatternPlacement`'s module centre in face-local metres, as generated. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `center` supplies `IAutoMoviePatternPlacement`'s module centre in face-local metres, as generated when the engine resolves the declared physical-module pattern deterministically.
   */
  center: IAutoMoviePatternPoint;
  /**
   * Module footprint in metres, as generated.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `size` records `IAutoMoviePatternPlacement`'s module footprint in metres, as generated. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `size` supplies `IAutoMoviePatternPlacement`'s module footprint in metres, as generated when the engine resolves the declared physical-module pattern deterministically.
   */
  size: {
    /** Extent along the module's own U axis. */
    u: number;
    /** Extent along the module's own V axis. */
    v: number;
  };
  /**
   * In-plane module rotation in degrees.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `rotationDeg` records `IAutoMoviePatternPlacement`'s in-plane module rotation in degrees. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `rotationDeg` supplies `IAutoMoviePatternPlacement`'s in-plane module rotation in degrees when the engine resolves the declared physical-module pattern deterministically.
   */
  rotationDeg: number;
  /**
   * Grain direction in degrees, read modulo 180.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `grainDeg` records `IAutoMoviePatternPlacement`'s grain direction in degrees, read modulo 180. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `grainDeg` supplies `IAutoMoviePatternPlacement`'s grain direction in degrees, read modulo 180 when the engine resolves the declared physical-module pattern deterministically.
   */
  grainDeg: number;
  /**
   * Whether the piece is laid face-flipped, its own U axis reversed.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `mirror` records whether the piece is laid face-flipped, its own U axis reversed for `IAutoMoviePatternPlacement`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `mirror` tells the engine whether the piece is laid face-flipped, its own U axis reversed for `IAutoMoviePatternPlacement` as it resolves the declared physical-module pattern deterministically.
   */
  mirror: boolean;
  /**
   * Surviving area in square metres.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `area` records `IAutoMoviePatternPlacement`'s surviving area in square metres. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `area` supplies `IAutoMoviePatternPlacement`'s surviving area in square metres when the engine resolves the declared physical-module pattern deterministically.
   */
  area: number;
  /**
   * Surviving fraction of the module's own area, within `(0, 1]`.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `coverage` records `IAutoMoviePatternPlacement`'s surviving fraction of the module's own area, within `(0, 1]`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `coverage` supplies `IAutoMoviePatternPlacement`'s surviving fraction of the module's own area, within `(0, 1]` when the engine resolves the declared physical-module pattern deterministically.
   */
  coverage: number;
  /**
   * What reduced the module, if anything.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `cut` records what reduced the module, if anything for `IAutoMoviePatternPlacement`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `cut` tells the engine what reduced the module, if anything for `IAutoMoviePatternPlacement` as it resolves the declared physical-module pattern deterministically.
   */
  cut: "none" | "boundary" | "exclusion" | "both";
  /**
   * Seeded variant index within `[0, variants)`.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `variant` records `IAutoMoviePatternPlacement`'s seeded variant index within `[0, variants)`. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `variant` supplies `IAutoMoviePatternPlacement`'s seeded variant index within `[0, variants)` when the engine resolves the declared physical-module pattern deterministically.
   */
  variant: number;
  /**
   * The module clipped to its zone region, counter-clockwise.
   *
   * This, and not the module rectangle, is what a joint is measured between,
   * because a joint is read on the surface rather than on the drawing.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `outline` records `IAutoMoviePatternPlacement`'s module clipped to its zone region, counter-clockwise. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `outline` supplies `IAutoMoviePatternPlacement`'s module clipped to its zone region, counter-clockwise when the engine resolves the declared physical-module pattern deterministically.
   */
  outline: IAutoMoviePatternPoint[];
  /**
   * Square metres an exclusion took out of the area {@link outline} draws.
   *
   * The outline is a convex polygon, because a convex module clipped to a
   * convex region stays convex. Subtracting an exclusion generally does not, so
   * a punched piece's true shape is not this outline and no convex kernel path
   * can build it; the run reports that as its own finding rather than handing
   * back an outline that quietly covers the opening. Zero means no exclusion
   * reached the piece and the outline is the piece.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `punchedArea` records `IAutoMoviePatternPlacement`'s square metres an exclusion took out of the area `outline` draws. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `punchedArea` supplies `IAutoMoviePatternPlacement`'s square metres an exclusion took out of the area `outline` draws when the engine resolves the declared physical-module pattern deterministically.
   */
  punchedArea: number;
}
