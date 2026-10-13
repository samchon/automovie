/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */


/**
 * Cubic-bezier control points as named fields, not a tuple: the v1 form of the
 * engine's `[x1, y1, x2, y2]`, in the unit square (CSS `cubic-bezier`
 * convention).
 *
 * @author Samchon
 */
export interface IAutoMovieLegacyBezier {
  /**
   * First control point x, in `[0, 1]`.
   */
  x1: number;

  /**
   * First control point y.
   */
  y1: number;

  /**
   * Second control point x, in `[0, 1]`.
   */
  x2: number;

  /**
   * Second control point y.
   */
  y2: number;
}
