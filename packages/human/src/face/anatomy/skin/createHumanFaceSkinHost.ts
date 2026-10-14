import {
  type IAutoMovieSignedMeshQueryHit as IAutoMovieSignedMeshQueryHitImported,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";

import { HumanExactFraction as Fraction } from "../../../common/measure/HumanExactFraction";
import type { IHumanExactFraction as IHumanExactFractionImported } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceExactSkinSeat } from "./IHumanFaceExactSkinSeat";
import type { IHumanFaceProjectedSkinCourse as IHumanFaceProjectedSkinCourseImported } from "./IHumanFaceProjectedSkinCourse";
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
 * Existing seats must name resident facets with valid sum-one barycentrics.
 * Normal arithmetic assumes representable face-area sums at facial scale;
 * the eager normal path does not independently certify arbitrary finite but
 * overflowing coordinates or a globally embedded manifold. The lazy native
 * distance query performs its own stronger mesh admission when requested.
 *
 * @evidence contracts/common.md#principled-implementation Copied native triangles supply coordinate-welded area normals and exact rational affine frame positions; the lazy engine query supplies nearest features and local open-sheet signs. Seat validity and finite normal arithmetic remain caller premises.
 * @evidence contracts/common.md#clear-and-simple-design One immutable host owns normals, native corners and lazy nearest search; ordinary frame reads share frameExact and free-guide projection delegates to its existing compiler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact coordinate welding preserves seam aliases without tolerance registration. Gram barycentric recovery is bounded geometric projection; smooth-normal fallback is a facet orientation convention, not hidden anatomical accuracy or arbitrary-coordinate certification.
 * @evidence contracts/common.md#meaningful-documentation The prose gives metre frame, snapshot and invalidation, lazy query, exact versus represented weights, normal fallback, open-sheet sign and remaining input/numerical premises.
 * @evidence contracts/performance.md#efficient-algorithms Eager normal construction scans V vertices/T triangles in expected O(V+T) map work; nearest compilation adds native admission and box hierarchy only on first use, with nearest-first query traversal O(T) worst case. Frame reads use three corners with rational bit-size cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One copied mesh and welded normal field serve every frame, and one lazy native hierarchy serves both seat and signedDistance queries; its previous winner warms traversal without choosing the answer. Moved skin requires a new host.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host retains O(V+T) copied coordinates/indices/normals and optional native query for its consumer lifetime; compilation maps not captured afterward are collectible, query failure commits no completed query and no external task/handle exists.
 */
export function createHumanFaceSkinHost(
  indices: readonly number[],
  positions: readonly number[],
): IHumanFaceSkinHost {
  const count: number = positions.length / 3;
  if (
    !Number.isInteger(count) ||
    indices.length % 3 !== 0 ||
    indices.some(
      (id: number): boolean => !Number.isInteger(id) || id < 0 || id >= count,
    ) ||
    positions.some((value: number): boolean => !Number.isFinite(value))
  )
    throw new Error("A skin host needs finite positions and resident indices.");
  const points: number[] = [...positions];
  const corners: number[] = [...indices];
  const corner: (triangle: number, at: number) => number = (
    triangle: number,
    at: number,
  ): number => corners[3 * triangle + at] * 3;
  const faceNormal: (triangle: number) => number[] = (
    triangle: number,
  ): number[] => {
    const a: number = corner(triangle, 0),
      b: number = corner(triangle, 1),
      c: number = corner(triangle, 2);
    const ux: number = points[b] - points[a],
      uy: number = points[b + 1] - points[a + 1],
      uz: number = points[b + 2] - points[a + 2];
    const vx: number = points[c] - points[a],
      vy: number = points[c + 1] - points[a + 1],
      vz: number = points[c + 2] - points[a + 2];
    return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  };
  // Accumulate area vectors per coordinate, so seam copies share one normal.
  const welded: Map<string, number[]> = new Map<string, number[]>();
  const owner: number[][] = new Array(count);
  for (let vertex: number = 0; vertex < count; vertex++) {
    const key: string =
      points[3 * vertex] +
      "," +
      points[3 * vertex + 1] +
      "," +
      points[3 * vertex + 2];
    let sum: number[] | undefined = welded.get(key);
    if (sum === undefined) welded.set(key, (sum = [0, 0, 0]));
    owner[vertex] = sum;
  }
  for (let triangle: number = 0; triangle < corners.length / 3; triangle++) {
    const area: number[] = faceNormal(triangle);
    if (!(Math.hypot(...area) > 0))
      throw new Error("A skin host triangle has no area: " + triangle);
    for (let at: number = 0; at < 3; at++) {
      const sum: number[] = owner[corners[3 * triangle + at]];
      sum[0] += area[0];
      sum[1] += area[1];
      sum[2] += area[2];
    }
  }
  const normals: number[] = new Array<number>(points.length).fill(0);
  for (let vertex: number = 0; vertex < count; vertex++) {
    const sum: number[] = owner[vertex],
      length: number = Math.hypot(...sum);
    if (!(length > 0)) continue;
    normals[3 * vertex] = sum[0] / length;
    normals[3 * vertex + 1] = sum[1] / length;
    normals[3 * vertex + 2] = sum[2] / length;
  }
  let query: ReturnType<typeof createAutoMovieSignedMeshQuery> | undefined;
  const nearest: (
    point: readonly number[],
  ) => IAutoMovieSignedMeshQueryHitImported = (
    point: readonly number[],
  ): IAutoMovieSignedMeshQueryHitImported =>
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
  const frameExact: (seat: IHumanFaceExactSkinSeat) => IHumanFaceSkinFrame = (
    seat: IHumanFaceExactSkinSeat,
  ): IHumanFaceSkinFrame => {
    const point: IHumanExactFractionImported[] = [0, 0, 0].map(
        (): IHumanExactFractionImported => Fraction.create(0n),
      ),
      blend: number[] = [0, 0, 0];
    for (let at: number = 0; at < 3; at++) {
      const id: number = corner(seat.triangle, at);
      const weight: number = Fraction.number(seat.weights[at]);
      for (let axis: number = 0; axis < 3; axis++) {
        point[axis] = Fraction.add(
          point[axis],
          Fraction.multiply(seat.weights[at], Fraction.from(points[id + axis])),
        );
        blend[axis] += weight * normals[id + axis];
      }
    }
    const area: number[] = faceNormal(seat.triangle),
      areaLength: number = Math.hypot(...area);
    const face: number[] = area.map(
      (value: number): number => value / areaLength,
    );
    const length: number = Math.hypot(...blend);
    const smooth: number[] =
      length > 0 &&
      blend[0] * face[0] + blend[1] * face[1] + blend[2] * face[2] > 0
        ? blend.map((value: number): number => value / length)
        : face;
    return { point: point.map(Fraction.number), normal: smooth, face };
  };
  const seat: (point: readonly number[]) => IHumanFaceSkinSeat = (
    point: readonly number[],
  ): IHumanFaceSkinSeat => {
    const hit: IAutoMovieSignedMeshQueryHitImported = nearest(point);
    const a: number = corner(hit.triangle, 0),
      b: number = corner(hit.triangle, 1),
      c: number = corner(hit.triangle, 2);
    // Solve the hit in its triangle's plane; the hit lies on that triangle.
    const u: number[] = [0, 1, 2].map(
      (axis: number): number => points[b + axis] - points[a + axis],
    );
    const v: number[] = [0, 1, 2].map(
      (axis: number): number => points[c + axis] - points[a + axis],
    );
    const w: number[] = [0, 1, 2].map(
      (axis: number): number => hit.point[axis] - points[a + axis],
    );
    const uu: number = u[0] * u[0] + u[1] * u[1] + u[2] * u[2],
      uv: number = u[0] * v[0] + u[1] * v[1] + u[2] * v[2],
      vv: number = v[0] * v[0] + v[1] * v[1] + v[2] * v[2],
      wu: number = w[0] * u[0] + w[1] * u[1] + w[2] * u[2],
      wv: number = w[0] * v[0] + w[1] * v[1] + w[2] * v[2];
    const determinant: number = uu * vv - uv * uv;
    const s: number = Math.min(
      1,
      Math.max(0, (wu * vv - wv * uv) / determinant),
    );
    const t: number = Math.min(
      1 - s,
      Math.max(0, (wv * uu - wu * uv) / determinant),
    );
    return { triangle: hit.triangle, weights: [1 - s - t, s, t] };
  };
  return {
    seat,
    frame: (seat: IHumanFaceSkinSeat): IHumanFaceSkinFrame =>
      frameExact({
        triangle: seat.triangle,
        weights: [
          Fraction.from(seat.weights[0]),
          Fraction.from(seat.weights[1]),
          Fraction.from(seat.weights[2]),
        ],
      }),
    frameExact,
    corners: (triangle: number): number[] =>
      corners.slice(3 * triangle, 3 * triangle + 3),
    signedDistance: (point: readonly number[]): number =>
      nearest(point).signedDistance,
    normals,
    compileProjectedCourse: (
      guide: readonly (readonly number[])[],
    ): IHumanFaceProjectedSkinCourseImported =>
      compileHumanFaceProjectedSkinCourse({
        positions: points,
        indices: corners,
        guide,
      }),
  };
}
