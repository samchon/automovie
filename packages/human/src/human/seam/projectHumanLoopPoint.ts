import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Project a point onto the nearest edge of an admitted closed polyline.
 * Seam compilation and collar-weight lookup share the projection, including
 * first-edge tie ownership and zero-length edge handling. Inputs are read only
 * in one common metre frame; the result is an edge index and convex fraction.
 * This nearest projection does not by itself certify cyclic loop ordering.
 *
 * @evidence contracts/common.md#principled-implementation Orthogonal projection onto each segment, clamped to its endpoints, minimizes squared distance on that segment; the least distance over all segments owns the polyline projection.
 * @evidence contracts/common.md#clear-and-simple-design One edge walk owns the projection used by both seam coordinate consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact distance ties retain the first edge; no fitted epsilon changes correspondence.
 * @evidence contracts/common.md#meaningful-documentation States metric, tie, degeneracy, frame, mutation and ordering limitation.
 * @evidence contracts/modeling.md#spatial-conventions Positions share the caller's metre frame and returned fraction is dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authored channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Reads an existing loop; the seam owns boundary identity.
 * @evidenceExclude contracts/modeling.md#rendered-observation Owns no displayed form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Defines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits no anatomical input.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no user input.
 */
export function projectHumanLoopPoint(
  points: readonly IAutoMovieVector3[],
  p: IAutoMovieVector3,
): { edge: number; fraction: number } {
  let best = { edge: 0, fraction: 0, distance: Infinity };
  for (let edge = 0; edge < points.length; edge++) {
    const a = points[edge];
    const b = points[(edge + 1) % points.length];
    const along = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const length = along.x * along.x + along.y * along.y + along.z * along.z;
    const raw =
      length === 0
        ? 0
        : ((p.x - a.x) * along.x +
            (p.y - a.y) * along.y +
            (p.z - a.z) * along.z) /
          length;
    const fraction = Math.min(1, Math.max(0, raw));
    const distance = Math.hypot(
      p.x - (a.x + along.x * fraction),
      p.y - (a.y + along.y * fraction),
      p.z - (a.z + along.z * fraction),
    );
    if (distance < best.distance) best = { edge, fraction, distance };
  }
  return { edge: best.edge, fraction: best.fraction };
}
