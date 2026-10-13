import {
  IAutoMovieOpeningProfile,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

/**
 * The straight polygon that exactly bounds a possibly arced outline.
 *
 * A circular arc of at most a half turn never leaves the rectangle spanned by
 * its own chord and its sagitta: measured in the chord frame its tangential
 * extent is the chord itself and its normal extent is the sagitta, both reached
 * exactly. Replacing each arc edge by that rectangle's two far corners
 * therefore yields a straight polygon containing the true outline, tight at
 * every extreme, and every containment or separation answer taken from it errs
 * only towards refusing.
 *
 * A bulge is the DXF tangent-of-quarter-angle value, positive leaning left of
 * the edge direction; the half-turn premise holds because
 * `validateBuiltEnvironment` refuses a bulge outside [-1, 1]. Absent bulges
 * mean straight edges and return the outline's own points. The result is in
 * the profile's planar frame and may be non-convex wherever the outline is.
 */
export const outlineHull = (
  profile: IAutoMovieOpeningProfile,
): IAutoMoviePlanarPoint[] => {
  const points = profile.outline;
  const hull: IAutoMoviePlanarPoint[] = [];
  points.forEach((from, index) => {
    const to = points[(index + 1) % points.length]!;
    hull.push(from);
    const bulge = profile.bulges?.[index] ?? 0;
    if (bulge === 0) return;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const chord = Math.hypot(dx, dy);
    // The sagitta of a bulged edge is half its chord times the bulge, and the
    // arc leans to the left of the edge's own direction for a positive bulge.
    const sagitta = (chord / 2) * bulge;
    const offsetX = (-dy / chord) * sagitta;
    const offsetY = (dx / chord) * sagitta;
    hull.push({ x: from.x + offsetX, y: from.y + offsetY });
    hull.push({ x: to.x + offsetX, y: to.y + offsetY });
  });
  return hull;
};
