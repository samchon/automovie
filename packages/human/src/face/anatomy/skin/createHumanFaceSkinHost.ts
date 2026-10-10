import { createAutoMovieSignedMeshQuery } from "@automovie/engine";

import { HumanExactFraction as Fraction } from "../../../common/measure/HumanExactFraction";
import type { IHumanFaceExactSkinSeat } from "./IHumanFaceExactSkinSeat";
import type { IHumanFaceSkinFrame } from "./IHumanFaceSkinFrame";
import type { IHumanFaceSkinHost } from "./IHumanFaceSkinHost";
import type { IHumanFaceSkinSeat } from "./IHumanFaceSkinSeat";
import { compileHumanFaceProjectedSkinCourse } from "./compileHumanFaceProjectedSkinCourse";

/**
 * Compile one state of the face skin into a host for attached parts.
 *
 * The skin is the triangles it is drawn with. A free point is seated on the
 * nearest point of those triangles and kept as a triangle and barycentric
 * weights; a seat is read back as the same weights over the triangle's
 * current corners. The position reader retains exact represented or rational
 * weights through the affine sum and rounds the final point once. The normal
 * field still uses the same represented weights and native area vectors.
 * Nothing is projected along a head axis, so the host is
 * equally valid on the forehead, on the temple where the skin turns away from
 * the front, under the jaw and behind the ear.
 *
 * The smooth normal of a vertex is the normalized sum of the area vectors of
 * the triangles around it, taken over every vertex with exactly the same
 * coordinates, so a seam that duplicates a vertex does not split its normal.
 * Inside a triangle the normal is the normalized barycentric blend of its
 * three corner normals; where that blend vanishes or opposes the triangle the
 * triangle's own normal is used. A vertex no triangle uses keeps a zero
 * normal.
 *
 * The nearest-point index is built on first use, because a consumer that only
 * needs vertex normals (skin relief) should not pay for it. Positions and
 * indices are read once and copied where retained; the host never changes and
 * a moved skin needs a new host. Coordinates are head-frame metres. A
 * triangle of zero area, a non-finite coordinate or an index outside the
 * positions refuses.
 */
export function createHumanFaceSkinHost(
  indices: readonly number[],
  positions: readonly number[],
): IHumanFaceSkinHost {
  const count = positions.length / 3;
  if (
    !Number.isInteger(count) ||
    indices.length % 3 !== 0 ||
    indices.some((id) => !Number.isInteger(id) || id < 0 || id >= count) ||
    positions.some((value) => !Number.isFinite(value))
  )
    throw new Error("A skin host needs finite positions and resident indices.");
  const points = [...positions];
  const corners = [...indices];
  const corner = (triangle: number, at: number): number =>
    corners[3 * triangle + at] * 3;
  const faceNormal = (triangle: number): number[] => {
    const a = corner(triangle, 0),
      b = corner(triangle, 1),
      c = corner(triangle, 2);
    const ux = points[b] - points[a],
      uy = points[b + 1] - points[a + 1],
      uz = points[b + 2] - points[a + 2];
    const vx = points[c] - points[a],
      vy = points[c + 1] - points[a + 1],
      vz = points[c + 2] - points[a + 2];
    return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  };
  // Accumulate area vectors per coordinate, so seam copies share one normal.
  const welded = new Map<string, number[]>();
  const owner: number[][] = new Array(count);
  for (let vertex = 0; vertex < count; vertex++) {
    const key =
      points[3 * vertex] +
      "," +
      points[3 * vertex + 1] +
      "," +
      points[3 * vertex + 2];
    let sum = welded.get(key);
    if (sum === undefined) welded.set(key, (sum = [0, 0, 0]));
    owner[vertex] = sum;
  }
  for (let triangle = 0; triangle < corners.length / 3; triangle++) {
    const area = faceNormal(triangle);
    if (!(Math.hypot(...area) > 0))
      throw new Error("A skin host triangle has no area: " + triangle);
    for (let at = 0; at < 3; at++) {
      const sum = owner[corners[3 * triangle + at]];
      sum[0] += area[0];
      sum[1] += area[1];
      sum[2] += area[2];
    }
  }
  const normals = new Array<number>(points.length).fill(0);
  for (let vertex = 0; vertex < count; vertex++) {
    const sum = owner[vertex],
      length = Math.hypot(...sum);
    if (!(length > 0)) continue;
    normals[3 * vertex] = sum[0] / length;
    normals[3 * vertex + 1] = sum[1] / length;
    normals[3 * vertex + 2] = sum[2] / length;
  }
  let query: ReturnType<typeof createAutoMovieSignedMeshQuery> | undefined;
  const nearest = (point: readonly number[]) =>
    (query ??= createAutoMovieSignedMeshQuery(
      {
        positions: points,
        indices: corners,
        normals: null,
        uvs: null,
        skin: null,
      },
      { boundary: "open" },
    ))(point);
  const frameExact = (seat: IHumanFaceExactSkinSeat): IHumanFaceSkinFrame => {
    const point = [0, 0, 0].map(() => Fraction.create(0n)),
      blend = [0, 0, 0];
    for (let at = 0; at < 3; at++) {
      const id = corner(seat.triangle, at);
      const weight = Fraction.number(seat.weights[at]);
      for (let axis = 0; axis < 3; axis++) {
        point[axis] = Fraction.add(
          point[axis],
          Fraction.multiply(seat.weights[at], Fraction.from(points[id + axis])),
        );
        blend[axis] += weight * normals[id + axis];
      }
    }
    const area = faceNormal(seat.triangle),
      areaLength = Math.hypot(...area);
    const face = area.map((value) => value / areaLength);
    const length = Math.hypot(...blend);
    const smooth =
      length > 0 &&
      blend[0] * face[0] + blend[1] * face[1] + blend[2] * face[2] > 0
        ? blend.map((value) => value / length)
        : face;
    return { point: point.map(Fraction.number), normal: smooth, face };
  };
  const seat = (point: readonly number[]): IHumanFaceSkinSeat => {
    const hit = nearest(point);
    const a = corner(hit.triangle, 0),
      b = corner(hit.triangle, 1),
      c = corner(hit.triangle, 2);
    // Solve the hit in its triangle's plane; the hit lies on that triangle.
    const u = [0, 1, 2].map((axis) => points[b + axis] - points[a + axis]);
    const v = [0, 1, 2].map((axis) => points[c + axis] - points[a + axis]);
    const w = [0, 1, 2].map((axis) => hit.point[axis] - points[a + axis]);
    const uu = u[0] * u[0] + u[1] * u[1] + u[2] * u[2],
      uv = u[0] * v[0] + u[1] * v[1] + u[2] * v[2],
      vv = v[0] * v[0] + v[1] * v[1] + v[2] * v[2],
      wu = w[0] * u[0] + w[1] * u[1] + w[2] * u[2],
      wv = w[0] * v[0] + w[1] * v[1] + w[2] * v[2];
    const determinant = uu * vv - uv * uv;
    const s = Math.min(1, Math.max(0, (wu * vv - wv * uv) / determinant));
    const t = Math.min(1 - s, Math.max(0, (wv * uu - wu * uv) / determinant));
    return { triangle: hit.triangle, weights: [1 - s - t, s, t] };
  };
  return {
    seat,
    frame: (seat) =>
      frameExact({
        triangle: seat.triangle,
        weights: [
          Fraction.from(seat.weights[0]),
          Fraction.from(seat.weights[1]),
          Fraction.from(seat.weights[2]),
        ],
      }),
    frameExact,
    corners: (triangle) => corners.slice(3 * triangle, 3 * triangle + 3),
    signedDistance: (point) => nearest(point).signedDistance,
    normals,
    compileProjectedCourse: (guide) =>
      compileHumanFaceProjectedSkinCourse({
        positions: points,
        indices: corners,
        guide,
      }),
  };
}
