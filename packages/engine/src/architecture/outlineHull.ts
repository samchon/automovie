import { IAutoMovieOpeningProfile, IAutoMoviePlanarPoint } from "@automovie/interface";

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
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `outlineHull` produces the straight polygon that exactly bounds a possibly arced outline. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `outlineHull` replaces arced edges with sampled points and returns their bounding straight polygon for finite topology checks.
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
