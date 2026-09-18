import { convexHull2D } from "../math/convexHull2D";
import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { finitePoint } from "./finitePoint";
import { finiteVector } from "./finiteVector";
import { meshOf } from "./meshOf";
import { pathFrames } from "./proceduralPathFrames";
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Sweep a convex 2D profile along a 3D polyline using a stable local frame.
 *
 * This is the code path for moulding, rails, pipes, arches, and other members
 * whose section repeats along a path. Adjacent path points must be distinct.
 * Both ends are capped, so a sweep along a simple path is a closed solid.
 * The section frame follows successive path tangents by shortest-arc transport,
 * preserving its orientation through bends instead of reselecting world axes.
 *
 * No texture coordinates are emitted, for the same reason
 * {@link extrudeAutoMovieProfile} emits none: each ring is one strip of shared
 * vertices closed with a modular index, and the caps read those same vertices,
 * so no one coordinate serves both the seam and the cap. The atlas-bearing form
 * of this operation is [loftAutoMovieSections](./proceduralLoft.ts) with the same section
 * declared at `at` 0 and `at` 1, which sweeps a section this one would have
 * hulled and lays a stated metric atlas over it. Reach for that one whenever
 * the member carries a finish.
 *
 * Declaring both sections the same spares that substitute the taper's cost and
 * not the bend's, which matters here more than anywhere because the members
 * listed above are curved runs. A loft around a turn carries the density
 * gradient stated on [loftAutoMovieSections](./proceduralLoft.ts), so on a curved path the
 * substitution replaces the geometry rather than the finish: read that contract
 * before putting a directional or density-critical finish on the result, and
 * mitre a straight run instead where the finish has to hold.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Builds a solid by sweeping one authored section along a path.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Connects section copies into a closed sweep topology.
 */
export const sweepAutoMovieProfile = (props: {
  profile: readonly IAutoMovieProfilePoint[];
  path: readonly IAutoMovieVector3[];
}): IAutoMovieMesh => {
  const profile = profileHull(props.profile);
  if (props.path.length < 2)
    throw new Error("sweep path needs at least two points");
  props.path.forEach((point, index) =>
    finiteVector(point, `sweep path[${index}]`),
  );
  const frames = pathFrames(props.path, "sweep path");
  const positions: number[] = [];
  props.path.forEach((point, index) => {
    const { right, up } = frames[index]!;
    for (const profilePoint of profile)
      positions.push(
        point.x + right.x * profilePoint.x + up.x * profilePoint.y,
        point.y + right.y * profilePoint.x + up.y * profilePoint.y,
        point.z + right.z * profilePoint.x + up.z * profilePoint.y,
      );
  });
  const count = profile.length;
  const indices: number[] = [];
  for (let ring = 0; ring + 1 < props.path.length; ++ring)
    for (let point = 0; point < count; ++point) {
      const nextPoint = (point + 1) % count;
      const current = ring * count + point;
      const nextRing = current + count;
      indices.push(current, nextPoint + ring * count, nextRing);
      indices.push(
        nextPoint + ring * count,
        nextRing + nextPoint - point,
        nextRing,
      );
    }
  for (let point = 1; point + 1 < count; ++point) {
    indices.push(0, point + 1, point);
    const last = (props.path.length - 1) * count;
    indices.push(last, last + point, last + point + 1);
  }
  return meshOf(positions, indices);
};

const profileHull = (
  profile: readonly IAutoMovieProfilePoint[],
): IAutoMovieProfilePoint[] => {
  profile.forEach((point, index) => finitePoint(point, `profile[${index}]`));
  const hull = convexHull2D(
    profile.map((point) => ({ x: point.x, y: 0, z: point.y })),
  ).map((point) => ({ x: point.x, y: point.z }));
  if (hull.length < 3)
    throw new Error("profile needs at least three non-collinear points");
  if (hull.length !== profile.length)
    throw new Error("profile must be convex and contain no interior points");
  return hull;
};
