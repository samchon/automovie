/**
 * One point on the host face, in face-local metres.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `IAutoMoviePatternPoint` represents one point on the host face, in face-local metres. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `IAutoMoviePatternPoint` structures one point on the host face, in face-local metres for the system that resolves the declared physical-module pattern deterministically.
 */
export interface IAutoMoviePatternPoint {
  /**
   * Distance along the face's local U axis, in metres.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `u` records `IAutoMoviePatternPoint`'s distance along the face's local U axis, in metres. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `u` supplies `IAutoMoviePatternPoint`'s distance along the face's local U axis, in metres when the engine resolves the declared physical-module pattern deterministically.
   */
  u: number;
  /**
   * Distance along the face's local V axis, in metres.
   *
   * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `v` records `IAutoMoviePatternPoint`'s distance along the face's local V axis, in metres. This ensures authored physical-module placement and texture sampling remain under project control.
   * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `v` supplies `IAutoMoviePatternPoint`'s distance along the face's local V axis, in metres when the engine resolves the declared physical-module pattern deterministically.
   */
  v: number;
}
