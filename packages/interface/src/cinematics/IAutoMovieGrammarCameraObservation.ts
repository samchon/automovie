import type { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";

/**
 * One perspective camera sample at an edited shot boundary: its resolved world
 * placement plus the lens and raster the film-grammar read projects through.
 *
 * The production film-grammar pass fills it from `resolveCameraAt` at the
 * placement's first and last shown frame, with the staged camera's field of
 * view and the delivery aspect. `readFilmGrammar` throws when `fovY` is not in
 * `(0, 180)`, `aspect` is not finite and positive, or the position or a
 * rotation component is not finite.
 */
export interface IAutoMovieGrammarCameraObservation extends IAutoMovieResolvedCamera {
  /** Vertical field of view in degrees, in `(0, 180)`. */
  fovY: number;

  /** Raster width divided by height; finite and positive. */
  aspect: number;
}
