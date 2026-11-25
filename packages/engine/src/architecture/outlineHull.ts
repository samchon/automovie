import {
  IAutoMovieOpeningProfile,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

import { polygonDoubleArea } from "./polygonDoubleArea";

/**
 * A conservative straight polygon enclosing a possibly arced outline.
 *
 * An outward arc of at most a half turn is bounded by its chord-and-sagitta
 * rectangle. An inward arc retains its chord, because an inset rectangle
 * removes more of the void than the arc removes. Signed chord-ring area
 * determines winding; zero-area rings retain rectangle expansion, including
 * two-arc circles. A tilted rectangle may overstate profile-axis extents,
 * making containment and separation conservative.
 *
 * Bulge magnitude is tan(theta / 4), so sagitta is half the chord times bulge;
 * positive bulges lean left. Building validation admits magnitudes at most one
 * and distinct consecutive corners. The profile-frame result borrows original
 * corners and inserts two far corners only for expanded arcs. It may remain
 * non-convex, and simple-hull admission does not separately prove circular-arc
 * simplicity.
 *
 * @param profile Opening outline and optional per-edge bulges.
 * @returns The bounding straight ring, in outline order.
 */
export const outlineHull: (
  profile: IAutoMovieOpeningProfile,
) => IAutoMoviePlanarPoint[] = (
  profile: IAutoMovieOpeningProfile,
): IAutoMoviePlanarPoint[] => {
  const points: IAutoMoviePlanarPoint[] = profile.outline;
  const winding: number = profile.bulges?.some(
    (bulge: number): boolean => bulge !== 0,
  )
    ? polygonDoubleArea(points)
    : 0;
  const hull: IAutoMoviePlanarPoint[] = [];
  for (let index: number = 0; index < points.length; ++index) {
    const from: IAutoMoviePlanarPoint = points[index]!;
    const to: IAutoMoviePlanarPoint = points[(index + 1) % points.length]!;
    hull.push(from);
    const bulge: number = profile.bulges?.[index] ?? 0;
    if (bulge === 0 || (bulge > 0 && winding > 0) || (bulge < 0 && winding < 0))
      continue;
    const dx: number = to.x - from.x;
    const dy: number = to.y - from.y;
    const chord: number = Math.hypot(dx, dy);
    // The sagitta of a bulged edge is half its chord times the bulge, and the
    // arc leans to the left of the edge's own direction for a positive bulge.
    const sagitta: number = (chord / 2) * bulge;
    const offsetX: number = (-dy / chord) * sagitta;
    const offsetY: number = (dx / chord) * sagitta;
    hull.push({ x: from.x + offsetX, y: from.y + offsetY });
    hull.push({ x: to.x + offsetX, y: to.y + offsetY });
  }
  return hull;
};
