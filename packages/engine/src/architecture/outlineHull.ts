import {
  IAutoMovieOpeningProfile,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

import { polygonDoubleArea } from "./polygonDoubleArea";

/**
 * A conservative straight polygon enclosing a possibly arced outline.
 *
 * An outward arc of at most a half turn is bounded by its chord-and-sagitta rectangle. An inward arc retains its chord, because an inset rectangle removes more of the void than the arc removes. Signed chord-ring area determines winding; zero-area rings retain rectangle expansion, including two-arc circles. A tilted rectangle may overstate profile-axis extents, making containment and separation conservative.
 *
 * Bulge magnitude is tan(theta / 4), so sagitta is half the chord times bulge; positive bulges lean left. Building validation admits magnitudes at most one and distinct consecutive corners. The profile-frame result borrows original corners and inserts two far corners only for expanded arcs. It may remain non-convex, and simple-hull admission does not separately prove circular-arc simplicity.
 *
 * @param profile Opening outline and optional per-edge bulges.
 * @returns The bounding straight ring, in outline order.
 *
 * @evidence contracts/common.md#principled-implementation Half-turn-limited outward arcs expand to their chord/sagitta rectangle. Inward arcs retain the chord as the outer boundary of the void, avoiding an undersized inset rectangle. Signed chord-ring area determines the inward side; zero-area rings retain the existing arc rectangle rule. Building validation admits finite bounded bulges, nonzero chords and a simple resulting hull; it does not separately certify circular-arc simplicity.
 * @evidence contracts/common.md#clear-and-simple-design One arc-bounding rule shared by building validation, wall cutting, observation stations, opening extents and service validation, so every consumer measures an arched void the same way.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The inward/outward decision uses winding and bulge sign for every profile, with no shape catalogue or sampling. Straight and inward edges preserve their original corners; no self-crossing input is repaired by a convex hull.
 * @evidence contracts/common.md#meaningful-documentation States the two arc directions, zero-area chord policy, sagitta rectangle, conservative overestimate, validation and circular-simplicity limits, borrowed original corners, planar frame and output order.
 * @evidence contracts/performance.md#efficient-algorithms For n corners, winding and edge construction cost O(n) time with at most 3n output points. Winding is needed only when a nonzero bulge is stated; each expanded arc uses one chord length and normal offset.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure transformation of one profile that coordinates no work across requests; building validation computes each hull once and passes it to the overlap and panel-fit checks.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the returned ring of at most 3n points, which the caller owns; nothing else outlives the call.
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
