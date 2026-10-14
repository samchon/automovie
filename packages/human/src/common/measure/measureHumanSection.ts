import { Vector3, convexHull2D } from "@automovie/engine";
import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanSectionPlane } from "./IAutoMovieHumanSectionPlane";
import type { IAutoMovieHumanSectionReading } from "./IAutoMovieHumanSectionReading";

/**
 * Cut a triangle surface with a plane and return the closed section loop
 * nearest a seed point, with its perimeter, its tape girth, X extent and
 * rearmost Z (the body faces +Z).
 *
 * This is the instrument behind every girth the body reports, so it holds no
 * anatomy: the caller chooses the plane and the seed. Each triangle whose
 * vertices straddle the plane contributes one segment between two edge
 * crossings; crossings are keyed by their edge so neighbouring triangles share
 * them exactly, and the segments are chained through those keys into loops.
 * A vertex on the plane counts as the positive side. Each straddling triangle
 * has two crossing edge keys, and a crossing may lie at an on-plane endpoint;
 * keys preserve edge identity even when coordinates coincide. Open chains are
 * discarded, because a girth is the length of a closed contour.
 *
 * Several loops usually exist (a plane through a thigh also cuts the other
 * thigh and both hands); the one whose centroid is closest to the seed is the
 * measurement, and null is returned when no closed loop exists. The edge/loop walk is linear in the triangle count; tape girth additionally
 * sorts candidate-loop crossings for their convex hulls. A caller that cuts one surface at
 * many parallel stations passes `triangles`, the ordinals its own index
 * found near this plane (`indexHumanBodySectionTriangles`), and the walk then
 * reads only those. They must ascend and include every triangle that
 * straddles the plane; the section is then exactly the one a full walk
 * gives, because the extra triangles straddle nothing and the crossings
 * keep the full walk's order.
 * Optional declared physical correspondence supplies engine-resolved edge
 * identity, allowing attribute aliases to close the same source contour.
 * Interpolation still reads actual coordinates. No physical argument keeps
 * the original raw-index behavior; explicit points are not coordinate welded.
 * Current body, person and head readers supply unit plane normals; the hull
 * projection assumes that premise and does not normalize arbitrary normals.
 *
 * The perimeter follows the contour into every concavity; the girth is the
 * perimeter of the loop's convex hull in the plane, which is what a tape
 * pulled around the body reads: it bridges the gluteal cleft, the
 * inframammary fold and the navel as the ISO 8559-1 and ANSUR tape girths
 * do, and equals the perimeter on a convex section.
 *
 * @evidence contracts/common.md#principled-implementation Linear edge intersections keyed by raw or engine-resolved source identities assemble closed loops, discard open chains and select the centroid nearest the seed; a planar convex hull supplies tape girth. Valid indexed finite surfaces and unit plane normals are premises supplied by current body, person and head callers; hull projection does not normalize arbitrary input normals, and branched intersections are not certified as manifold contours.
 * @evidence contracts/common.md#clear-and-simple-design The caller owns anatomical station/seed and optional complete triangle index; this instrument owns incidence, loop selection and metrics, reusing engine physical identity and convexHull2D.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts On-plane points count positive without epsilon coordinate welding; explicit source aliases use the engine resolver, and no expected girth or specimen loop is substituted.
 * @evidence contracts/common.md#meaningful-documentation The prose gives closed-loop/open-chain behavior, seed choice, indexed-population completeness, physical versus legacy edge identity and contour/tape metric differences.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices, W walked triangles, S source pairs and C crossings, distance/identity storage is O(V+S), graph walking is O(W+C), and candidate-loop hull sorts add O(sum L log L); optional triangle selection narrows walking but retains the V-sized distance buffer.
 * @evidence contracts/performance.md#reuse-equivalent-work Each crossing edge is interpolated once through its key and shared by neighboring segments; one distance buffer and visited Set serve all loops, while source/plane changes prevent a cross-call contour cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Distance, point/adjacency maps, loops and hull arrays are call-local and bounded by the input/selected population; only five reading values including a centroid transfer, with no retained mesh handle or task.
 */
export function measureHumanSection(
  positions: number[],
  indices: number[],
  plane: IAutoMovieHumanSectionPlane,
  seed: IAutoMovieVector3,
  triangles?: readonly number[],
  physicalVertices?: IAutoMovieMesh["physicalVertices"],
): IAutoMovieHumanSectionReading | null {
  const count: number = positions.length / 3;
  const physical:
    | ReturnType<typeof resolveAutoMovieMeshPhysicalVertices>
    | undefined =
    physicalVertices === undefined
      ? undefined
      : resolveAutoMovieMeshPhysicalVertices({ positions, physicalVertices });
  const distance: Float64Array = new Float64Array(count);
  const measure: (v: number) => void = (v: number): void => {
    distance[v] =
      (positions[v * 3] - plane.point.x) * plane.normal.x +
      (positions[v * 3 + 1] - plane.point.y) * plane.normal.y +
      (positions[v * 3 + 2] - plane.point.z) * plane.normal.z;
  };
  // only the vertices a walked triangle reads are measured; the rest of the
  // buffer stays zero and is never read
  if (triangles === undefined)
    for (let v: number = 0; v < count; v++) measure(v);
  else
    for (const t of triangles)
      for (let k: number = 0; k < 3; k++) measure(indices[t * 3 + k]);
  const points: Map<string, [number, number, number]> = new Map<
    string,
    [number, number, number]
  >();
  const adjacency: Map<string, string[]> = new Map<string, string[]>();
  const crossing: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => {
    const first: number = physical?.vertices[a] ?? a;
    const second: number = physical?.vertices[b] ?? b;
    const key: string =
      first < second ? first + "/" + second : second + "/" + first;
    if (!points.has(key)) {
      const t: number = distance[a] / (distance[a] - distance[b]);
      points.set(key, [
        positions[a * 3] + t * (positions[b * 3] - positions[a * 3]),
        positions[a * 3 + 1] +
          t * (positions[b * 3 + 1] - positions[a * 3 + 1]),
        positions[a * 3 + 2] +
          t * (positions[b * 3 + 2] - positions[a * 3 + 2]),
      ]);
    }
    return key;
  };
  const walked: number = triangles?.length ?? indices.length / 3;
  for (let step: number = 0; step < walked; step++) {
    const t: number = (triangles === undefined ? step : triangles[step]) * 3;
    const keys: string[] = [];
    for (let k: number = 0; k < 3; k++) {
      const a: number = indices[t + k];
      const b: number = indices[t + ((k + 1) % 3)];
      if (distance[a] >= 0 !== distance[b] >= 0) keys.push(crossing(a, b));
    }
    if (keys.length !== 2) continue;
    for (const [from, to] of [
      [keys[0], keys[1]],
      [keys[1], keys[0]],
    ]) {
      const list: string[] | undefined = adjacency.get(from);
      if (list === undefined) adjacency.set(from, [to]);
      else list.push(to);
    }
  }
  const visited: Set<string> = new Set<string>();
  // an orthonormal frame of the plane, for the hull
  const n: IAutoMovieVector3 = plane.normal;
  const helper: IAutoMovieVector3 =
    Math.abs(n.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  const u: IAutoMovieVector3 = normalize(Vector3.cross(n, helper));
  const w: IAutoMovieVector3 = Vector3.cross(n, u);
  let best: IAutoMovieHumanSectionReading | null = null;
  let bestDistance: number = Infinity;
  for (const start of adjacency.keys()) {
    if (visited.has(start)) continue;
    const loop: string[] = [start];
    visited.add(start);
    let previous: string = start;
    let current: string = adjacency.get(start)![0];
    while (!visited.has(current)) {
      visited.add(current);
      loop.push(current);
      const next: string | undefined = adjacency
        .get(current)!
        .find((key: string): boolean => key !== previous);
      if (next === undefined) break;
      previous = current;
      current = next;
    }
    // The walk closes only when it returns to the start; a chain that ends at
    // a boundary crossing stops at a key with one neighbour and is not a girth.
    if (current !== start || loop.length < 3) continue;
    let perimeter: number = 0;
    let minX: number = Infinity;
    let maxX: number = -Infinity;
    let minZ: number = Infinity;
    let cx: number = 0;
    let cy: number = 0;
    let cz: number = 0;
    for (let i: number = 0; i < loop.length; i++) {
      const p: [number, number, number] = points.get(loop[i])!;
      const q: [number, number, number] = points.get(
        loop[(i + 1) % loop.length],
      )!;
      perimeter += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minZ = Math.min(minZ, p[2]);
      cx += p[0];
      cy += p[1];
      cz += p[2];
    }
    const centroid: IAutoMovieVector3 = {
      x: cx / loop.length,
      y: cy / loop.length,
      z: cz / loop.length,
    };
    const gap: number = Math.hypot(
      centroid.x - seed.x,
      centroid.y - seed.y,
      centroid.z - seed.z,
    );
    if (gap < bestDistance) {
      bestDistance = gap;
      // The tape girth is the perimeter of the loop's convex hull in the
      // plane frame (u, w), carried in the hull owner's x and z.
      const hull: IAutoMovieVector3[] = convexHull2D(
        loop.map((key: string): IAutoMovieVector3 => {
          const p: [number, number, number] = points.get(key)!;
          return {
            x: p[0] * u.x + p[1] * u.y + p[2] * u.z,
            y: 0,
            z: p[0] * w.x + p[1] * w.y + p[2] * w.z,
          };
        }),
      );
      let girth: number = 0;
      for (let i: number = 0; i < hull.length; i++) {
        const p: IAutoMovieVector3 = hull[i];
        const q: IAutoMovieVector3 = hull[(i + 1) % hull.length];
        girth += Math.hypot(q.x - p.x, q.z - p.z);
      }
      best = {
        perimeter,
        girth,
        breadth: maxX - minX,
        back: minZ,
        centroid,
      };
    }
  }
  return best;
}

/** Unit copy by one hypot division, the arithmetic the section's plane frame was measured with. */
function normalize(a: IAutoMovieVector3): IAutoMovieVector3 {
  const size: number = Math.hypot(a.x, a.y, a.z);
  return { x: a.x / size, y: a.y / size, z: a.z / size };
}
