import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The world placement of the face a pattern was laid on.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMoviePatternFaceFrame` represents the world placement of the face a pattern was laid on. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMoviePatternFaceFrame` structures the world placement of the face a pattern was laid on for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMoviePatternFaceFrame {
  /**
   * World point the face-local origin sits at.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `origin` records `IAutoMoviePatternFaceFrame`'s world point the face-local origin sits at. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `origin` supplies `IAutoMoviePatternFaceFrame`'s world point the face-local origin sits at when the engine resolves the declared physical-module pattern deterministically.
   */
  origin: IAutoMovieVector3;
  /**
   * Unit world direction of the face-local U axis.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `u` records `IAutoMoviePatternFaceFrame`'s unit world direction of the face-local U axis. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `u` supplies `IAutoMoviePatternFaceFrame`'s unit world direction of the face-local U axis when the engine resolves the declared physical-module pattern deterministically.
   */
  u: IAutoMovieVector3;
  /**
   * Unit world direction of the face-local V axis, perpendicular to U.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `v` records `IAutoMoviePatternFaceFrame`'s unit world direction of the face-local V axis, perpendicular to U. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `v` supplies `IAutoMoviePatternFaceFrame`'s unit world direction of the face-local V axis, perpendicular to U when the engine resolves the declared physical-module pattern deterministically.
   */
  v: IAutoMovieVector3;
}
