/**
 * A ground-height source for a walked path: a constant plane height, or a
 * heightfield callback `(x, z) → y` (a slope, stairs approximated as a ramp).
 * Real surface geometry is #605; this is the scalar/callback seam it will
 * refine.
 */
export type AutoMoviePathGround = number | ((x: number, z: number) => number);
