/**
 * UV-bound normal relief on one body surface; the appearance owner retains texture admission and anatomical qualification.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySurfaceRelief {
  /** Existing material whose regions receive this relief. */
  material: string;

  /** Linear tangent-space normal PNG data URI, bound over UV0. */
  texture: string;
}
