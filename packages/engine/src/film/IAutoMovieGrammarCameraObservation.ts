import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";

/**
 * One perspective camera sample at an edited shot boundary: its resolved world
 * placement plus the lens and raster the film-grammar read projects through.
 *
 * The production film-grammar pass fills it from `resolveCameraAt` at the
 * placement's first and last shown frame, with the staged camera's field of
 * view and the delivery aspect. `readFilmGrammar` throws when `fovY` is not in
 * `(0, 180)`, `aspect` is not finite and positive, or the position or a
 * rotation component is not finite.
 *
 * @evidence contracts/development/design.md#principled-representation A pinhole camera: subjects are projected to normalized device coordinates with `halfY = tan(fovY / 2)` vertically and `halfY * aspect` horizontally, the standard perspective projection, so measured shot sizes and screen directions are read in the frame's own coordinates; the premise is a camera looking down its local `-Z`, the glTF convention `projectToNdc` applies, and a point at or behind the lens yields no measurement.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Extends the resolved placement with only the two lens facts projection needs, so the same placement type serves camera resolution and the grammar read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No default lens or aspect is substituted for an invalid one; the analyzer refuses the input instead of reading a frame no camera could produce.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer and when it samples, the units and valid ranges of both lens fields, and the failure effect of an invalid value.
 */
export interface IAutoMovieGrammarCameraObservation extends IAutoMovieResolvedCamera {
  /** Vertical field of view in degrees, in `(0, 180)`. */
  fovY: number;

  /** Raster width divided by height; finite and positive. */
  aspect: number;
}
