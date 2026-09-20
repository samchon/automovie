import { IAutoMoviePatternFaceFrame } from "./IAutoMoviePatternFaceFrame";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * One flat panel of a host that folds or curves, and the strip of the face it
 * carries.
 *
 * A pattern is laid on one plane because a joint, a cut piece, and a take-off
 * are all measured on the surface rather than in the air above it. A wall that
 * turns a corner and a facade that curves are still one surface, and unrolling
 * them is what keeps them one: the face-local plane is the developed surface,
 * distance along U is distance along the building past the corner, and each
 * zone then says which flat panel of the real host its own strip went back
 * onto.
 *
 * {@link anchor} is the developed point {@link frame}'s origin sits at, so a zone
 * starting three metres along the developed face returns to the return wall's
 * own origin rather than three metres past it. Without it a fold would turn the
 * panel and still leave the pieces where the flat face had put them.
 *
 * A module is a rigid piece, so it belongs to exactly one panel. A piece
 * crossing a fold is authored as two zones meeting at that fold, which is what
 * the two pieces really are: the border cut already butts them on the surface,
 * and the neighbour scan already measures across it.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMoviePatternFacet` represents one flat panel of a host that folds or curves, and the strip of the face it carries. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMoviePatternFacet` structures one flat panel of a host that folds or curves, and the strip of the face it carries for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMoviePatternFacet {
  /**
   * Zone whose pieces sit on this panel.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `zone` records `IAutoMoviePatternFacet`'s zone whose pieces sit on this panel. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `zone` supplies `IAutoMoviePatternFacet`'s zone whose pieces sit on this panel when the engine resolves the declared physical-module pattern deterministically.
   */
  zone: string;
  /**
   * Face-local metre point this panel's frame origin sits at.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `anchor` records `IAutoMoviePatternFacet`'s face-local metre point this panel's frame origin sits at. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `anchor` supplies `IAutoMoviePatternFacet`'s face-local metre point this panel's frame origin sits at when the engine resolves the declared physical-module pattern deterministically.
   */
  anchor: IAutoMoviePatternPoint;
  /**
   * World placement of that point.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `frame` records `IAutoMoviePatternFacet`'s world placement of that point. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `frame` supplies `IAutoMoviePatternFacet`'s world placement of that point when the engine resolves the declared physical-module pattern deterministically.
   */
  frame: IAutoMoviePatternFaceFrame;
}
