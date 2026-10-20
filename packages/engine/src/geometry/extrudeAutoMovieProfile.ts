import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { convexHull2D } from "../math/convexHull2D";
import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { finitePoint } from "./finitePoint";
import { meshOf } from "./meshOf";
import { positive } from "./positive";

/**
 * Extrude a convex XY profile along local Z into a closed triangle mesh
 * spanning `-depth / 2` to `+depth / 2`.
 *
 * The profile must be strictly convex: every point must be a hull corner, so
 * a concave, collinear, repeated or interior point is refused, as are fewer
 * than three non-collinear points, a non-finite point and a nonpositive depth.
 * The corners are re-ordered counter-clockwise from the hull's lowest-X corner.
 * Coordinates are metres; the input profile is only read.
 *
 * The result carries area-weighted vertex normals from `meshOf` and no texture
 * coordinates. Its side ring is one strip of shared vertices closed with a
 * modular index, so the vertex that starts the ring also ends it and no single
 * U could be both zero and the perimeter. `extrudeAutoMovieRegion` takes the
 * same kind of profile, keeps concave outlines and holes, and lays a metric
 * atlas over the result; use it whenever the prism carries a finish.
 *
 * @param props.profile Convex outline in local XY metres.
 * @param props.depth Positive extrusion depth along local Z, in metres.
 * @returns A closed mesh with normals and no UVs.
 *
 * @evidence contracts/common.md#principled-implementation Andrew's monotone chain through `convexHull2D` both orders the profile counter-clockwise and proves convexity, since a strictly convex polygon equals its hull; a counter-clockwise convex polygon fans from any corner into non-overlapping triangles, so the caps and side quads close a 2-manifold.
 * @evidence contracts/common.md#clear-and-simple-design Admission, hull ordering and index emission live here, while normal computation is delegated to `meshOf` shared with the revolver and sweep.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A profile that is not its own hull is refused rather than silently replaced by its hull, which would change the author's shape without saying so.
 * @evidence contracts/common.md#meaningful-documentation States the extent along Z, every refusal, the corner reordering, units and ownership, the normal and UV result with the reason for no UVs, and the operation to use instead for a finish.
 * @evidence contracts/performance.md#efficient-algorithms O(n log n) for the n-corner hull, then linear emission of 2n vertices and 4n - 4 triangles.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call builds one mesh from its own profile; a caller placing the same prism repeatedly can keep the returned mesh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns new position, index and normal arrays sized by the corner count; the hull and its lifted points are released on return.
 */
export const extrudeAutoMovieProfile = (props: {
  /** Strictly convex outline in local XY metres. */
  profile: readonly IAutoMovieProfilePoint[];

  /** Positive extrusion depth along local Z, in metres. */
  depth: number;
}): IAutoMovieMesh => {
  positive(props.depth, "extrusion depth");
  const profile: IAutoMovieProfilePoint[] = profileHull(props.profile);
  const half: number = props.depth / 2;
  const positions: number[] = [];
  for (const point of profile) positions.push(point.x, point.y, half);
  for (const point of profile) positions.push(point.x, point.y, -half);
  const count: number = profile.length;
  const indices: number[] = [];
  for (let index: number = 1; index + 1 < count; ++index) {
    indices.push(0, index, index + 1);
    indices.push(count, count + index + 1, count + index);
  }
  for (let index: number = 0; index < count; ++index) {
    const next: number = (index + 1) % count;
    indices.push(index, count + index, next);
    indices.push(next, count + index, count + next);
  }
  return meshOf(positions, indices);
};

/** The profile's corners counter-clockwise, refused unless it is its own hull. */
const profileHull = (
  profile: readonly IAutoMovieProfilePoint[],
): IAutoMovieProfilePoint[] => {
  profile.forEach((point: IAutoMovieProfilePoint, index: number): void =>
    finitePoint(point, `profile[${index}]`),
  );
  const hull: IAutoMovieProfilePoint[] = convexHull2D(
    profile.map(
      (point: IAutoMovieProfilePoint): IAutoMovieVector3 => ({
        x: point.x,
        y: 0,
        z: point.y,
      }),
    ),
  ).map(
    (point: IAutoMovieVector3): IAutoMovieProfilePoint => ({
      x: point.x,
      y: point.z,
    }),
  );
  if (hull.length < 3)
    throw new Error("profile needs at least three non-collinear points");
  if (hull.length !== profile.length)
    throw new Error("profile must be convex and contain no interior points");
  return hull;
};
