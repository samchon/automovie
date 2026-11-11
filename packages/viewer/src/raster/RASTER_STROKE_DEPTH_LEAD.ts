/**
 * How far a depth-tested line or point is drawn toward the camera along its own line of sight, in metres: two millimetres.
 *
 * A mark lying on a surface, such as an edge of the surface's own mesh or a curve the surface was built from, has the same depth as the surface and would lose pixels to it by rounding alone. The lead puts the mark in front without moving it on screen. It is small against the coarse forms a film is staged with, so a mark more than two millimetres behind a surface stays hidden.
 */
export const RASTER_STROKE_DEPTH_LEAD: number = 0.002;
