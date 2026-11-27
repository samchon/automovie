import {
  type IAutoMovieExtrudeProfile,
  IAutoMovieMesh,
  type IAutoMovieProfilePoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { convexHull2D } from "../../math/internal/convexHull2D";
import { meshOf } from "./meshOf";
import { positive } from "./positive";

/**
 * Extrude a convex XY profile along local Z into a closed triangle mesh
 * spanning `-depth / 2` to `+depth / 2`.
 *
 * The profile must be strictly convex: every point must be a hull corner, so a
 * concave, collinear, repeated or interior point is refused, as are fewer than
 * three non-collinear points, a non-finite point and a nonpositive depth. The
 * corners are re-ordered counter-clockwise from the hull's lowest-X corner.
 * Coordinates are metres; the input profile is only read.
 *
 * The result carries area-weighted vertex normals from `meshOf` and no texture
 * coordinates. Its side ring is one strip of shared vertices closed with a
 * modular index, so the vertex that starts the ring also ends it and no single
 * U could be both zero and the perimeter. `AutoMovieEnginePlanarRegion.extrude`
 * takes the same kind of profile, keeps concave outlines and holes, and lays a
 * metric atlas over the result; use it whenever the prism carries a finish.
 *
 * @param props.profile Convex outline in local XY metres.
 * @param props.depth Positive extrusion depth along local Z, in metres.
 * @returns A closed mesh with normals and no UVs.
 */
export const extrudeAutoMovieProfile = (
  props: IAutoMovieExtrudeProfile.IProps,
): IAutoMovieMesh => {
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
