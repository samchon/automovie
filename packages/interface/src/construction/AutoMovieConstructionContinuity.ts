/**
 * The continuity a join's blend keeps across both its rails: `G2`, the
 * position, the tangent plane and the normal curvature of each surface.
 *
 * The blend is the quintic Hermite in its cross parameter between the two
 * surfaces' 2-jets along their rails, so G2 holds exactly at the blend's
 * columns and to its interpolation between them.
 */
export type AutoMovieConstructionContinuity = "G2";
