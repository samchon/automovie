import {
  IAutoMovieOpeningProfile,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

/**
 * A conservative straight polygon enclosing a possibly arced outline.
 *
 * A circular arc of at most a half turn never leaves the rectangle spanned by
 * its own chord and its sagitta: measured in the chord frame its tangential
 * extent is the chord itself and its normal extent is the sagitta, both reached
 * exactly. Replacing each arc edge by that rectangle's two far corners
 * therefore yields a straight polygon containing the true outline. Its far
 * corners may overstate extrema in the profile axes for a tilted chord, so
 * containment or separation answers taken from it err towards refusing.
 *
 * A bulge's magnitude is `tan(theta / 4)` of the arc's included angle,
 * so the sagitta is half the chord times the bulge. The profile contract makes
 * a positive bulge lean left of the edge direction. The half-turn
 * premise holds because `validateBuiltEnvironment` refuses a bulge outside
 * [-1, 1], and it also refuses repeated consecutive corners, whose zero chord
 * would make a bulged edge's offset `NaN`. Absent or zero bulges mean straight
 * edges and contribute only the outline's own points, as the same objects. The
 * result is in the profile's planar frame, lists each corner followed by its
 * edge's two far corners when that edge bulges, and may be non-convex wherever
 * the outline is.
 *
 * @param profile Opening outline and optional per-edge bulges.
 * @returns The bounding straight ring, in outline order.
 *
 * @evidence contracts/common.md#principled-implementation For a circular arc of included angle at most pi, the chord-frame extents are exactly the chord and the sagitta `c/2 * tan(theta/4)`, so the chord-and-sagitta rectangle contains the arc and touches it at its extremes; the premises of a half-turn limit and a non-zero chord are enforced by building validation before any caller reads the hull.
 * @evidence contracts/common.md#clear-and-simple-design One arc-bounding rule shared by building validation, wall cutting, observation stations, opening extents and service validation, so every consumer measures an arched void the same way.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No opening shape is special-cased and arcs are bounded, not sampled; a straight edge is passed through unchanged rather than given a zero-width rectangle.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why the hull contains the arc, the profile's bulge sign, the tilted-chord overestimate, validation premises, straight-edge aliasing, coordinate frame and output point order.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the n edges, O(n) time, emitting at most 3n points; each arc needs only its chord length and one normal offset.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure transformation of one profile that coordinates no work across requests; building validation computes each hull once and passes it to the overlap and panel-fit checks.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates only the returned ring of at most 3n points, which the caller owns; nothing else outlives the call.
 */
export const outlineHull: (profile: IAutoMovieOpeningProfile) => IAutoMoviePlanarPoint [ ] = (
  profile: IAutoMovieOpeningProfile,
): IAutoMoviePlanarPoint[] => {
  const points: IAutoMoviePlanarPoint[] = profile.outline;
  const hull: IAutoMoviePlanarPoint[] = [];
  for (let index: number = 0; index < points.length; ++index) {
    const from: IAutoMoviePlanarPoint = points[index]!;
    const to: IAutoMoviePlanarPoint = points[(index + 1) % points.length]!;
    hull.push(from);
    const bulge: number = profile.bulges?.[index] ?? 0;
    if (bulge === 0) continue;
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
