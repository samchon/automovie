/**
 * A section's two sides, each from the front to the back of the midline: the
 * left is the canonical side, the right its declared reflection (z negated),
 * both cut by the same construction.
 */
export interface IAutoMovieHumanHeadSides {
  /** The left side's control points, `[x, y, z]` with `z >= 0`. */
  left: Vec3[];

  /** The right side's control points, `[x, y, z]` with `z <= 0`. */
  right: Vec3[];

  /** Last solved radius for extending a cached prefix; absent on independently supplied cuts. */
  radius?: number;
}

/** A point. */
type Vec3 = [number, number, number];
