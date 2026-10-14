import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { convexHull2D } from "../math/convexHull2D";
import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { finitePoint } from "./finitePoint";
import { finiteVector } from "./finiteVector";
import { meshOf } from "./meshOf";
import { pathFrames } from "./pathFrames";

/**
 * Sweep a convex 2D profile along a 3D polyline using a stable local frame.
 *
 * This is the code path for moulding, rails, pipes, arches, and other members
 * whose section repeats along a path. Profile `x` runs along the frame's right
 * axis and `y` along its up axis, both in metres, and path points are metres in
 * the mesh frame. The profile must be strictly convex: its corners are taken in
 * counter-clockwise hull order whatever order they were authored in, and a
 * collinear, repeated, or interior point is refused. Adjacent path points must
 * be distinct. Both ends are capped, so a sweep along a simple path is a closed
 * solid. The section frame follows successive path tangents by shortest-arc
 * transport, preserving its orientation through bends instead of reselecting
 * world axes.
 *
 * No texture coordinates are emitted, for the same reason
 * {@link extrudeAutoMovieProfile} emits none: each ring is one strip of shared
 * vertices closed with a modular index, and the caps read those same vertices,
 * so no one coordinate serves both the seam and the cap. The atlas-bearing form
 * of this operation is {@link loftAutoMovieSections} with the same section
 * declared at `at` 0 and `at` 1, which sweeps a section this one would have
 * hulled and lays a stated metric atlas over it. Reach for that one whenever
 * the member carries a finish.
 *
 * Declaring both sections the same spares that substitute the taper's cost and
 * not the bend's, which matters here more than anywhere because the members
 * listed above are curved runs. A loft around a turn carries the density
 * gradient stated on {@link loftAutoMovieSections}, so on a curved path the
 * substitution replaces the geometry rather than the finish: read that contract
 * before putting a directional or density-critical finish on the result, and
 * mitre a straight run instead where the finish has to hold.
 *
 * @param props.profile Corners of the convex section, at least three, finite.
 * @param props.path Centre line, at least two finite points with no adjacent repeats.
 * @returns A new unskinned mesh of `path.length * profile.length` shared vertices with smooth normals and no UVs.
 * @throws Error when the profile is not finite and strictly convex, or the path is too short, not finite, or repeats a point.
 *
 * @evidence contracts/common.md#principled-implementation A generalized cylinder: each path point carries the hulled section in a frame transported by shortest-arc rotation from `pathFrames`, adjacent rings are joined by two triangles per profile edge, and both ends are fan-capped from corner 0, which is exact for a convex section; smooth normals come from `meshOf`'s area-weighted face normals, and the remaining limitation is that a path turning tighter than the section's half-width folds the rings through each other, which is not detected.
 * @evidence contracts/common.md#clear-and-simple-design Admission, vertex placement and index strips are in one function, while frame transport, hull, finite checks and normal accumulation are the shared `pathFrames`, `convexHull2D`, `finitePoint`, `finiteVector` and `meshOf`; service-network runs lower through it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A concave or degenerate profile is refused rather than silently replaced by its hull, the path is never smoothed or deduplicated, and no UV is fabricated for a seam the strip cannot carry.
 * @evidence contracts/common.md#meaningful-documentation States the profile axes and units, the convexity and ordering rule, path requirements, capping and frame transport, why there are no UVs and which builder to use for a finish, and each refusal.
 * @evidence contracts/performance.md#efficient-algorithms For P profile points and N path points, the hull is O(P log P), frames are O(N), and vertices, the side strip and caps are O(N * P), which is the output size; the cap fans add O(P) and no pass revisits a ring.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call builds one requested mesh whose buffers the caller owns; a service network sweeps each segment once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the hull and frames are released on return and the position, index and normal arrays, sized by N * P, are transferred to the returned mesh.
 */
export const sweepAutoMovieProfile: (props: {
  profile: readonly IAutoMovieProfilePoint[];
  path: readonly IAutoMovieVector3[];
}) => IAutoMovieMesh = (props: {
  profile: readonly IAutoMovieProfilePoint[];
  path: readonly IAutoMovieVector3[];
}): IAutoMovieMesh => {
  const profile: IAutoMovieProfilePoint[] = profileHull(props.profile);
  if (props.path.length < 2)
    throw new Error("sweep path needs at least two points");
  props.path.forEach((point: IAutoMovieVector3, index: number): void =>
    finiteVector(point, `sweep path[${index}]`),
  );
  const frames: ReturnType<typeof pathFrames> = pathFrames(
    props.path,
    "sweep path",
  );
  const positions: number[] = [];
  props.path.forEach((point: IAutoMovieVector3, index: number): void => {
    const { right, up }: ReturnType<typeof pathFrames>[number] = frames[index]!;
    for (const profilePoint of profile)
      positions.push(
        point.x + right.x * profilePoint.x + up.x * profilePoint.y,
        point.y + right.y * profilePoint.x + up.y * profilePoint.y,
        point.z + right.z * profilePoint.x + up.z * profilePoint.y,
      );
  });
  const count: number = profile.length;
  const indices: number[] = [];
  for (let ring: number = 0; ring + 1 < props.path.length; ++ring)
    for (let point: number = 0; point < count; ++point) {
      const nextPoint: number = (point + 1) % count;
      const current: number = ring * count + point;
      const nextRing: number = current + count;
      indices.push(current, nextPoint + ring * count, nextRing);
      indices.push(
        nextPoint + ring * count,
        nextRing + nextPoint - point,
        nextRing,
      );
    }
  const last: number = (props.path.length - 1) * count;
  for (let point: number = 1; point + 1 < count; ++point) {
    indices.push(0, point + 1, point);
    indices.push(last, last + point, last + point + 1);
  }
  return meshOf(positions, indices);
};

/** The profile's corners in counter-clockwise hull order, refusing any profile that is not strictly convex. */
const profileHull: (
  profile: readonly IAutoMovieProfilePoint[],
) => IAutoMovieProfilePoint[] = (
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
