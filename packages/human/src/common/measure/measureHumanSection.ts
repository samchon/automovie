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
 * measurement, and null is returned when no closed loop exists. Cost is
 * linear in the triangle count per call. A caller that cuts one surface at
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
 *
 * The perimeter follows the contour into every concavity; the girth is the
 * perimeter of the loop's convex hull in the plane, which is what a tape
 * pulled around the body reads: it bridges the gluteal cleft, the
 * inframammary fold and the navel as the ISO 8559-1 and ANSUR tape girths
 * do, and equals the perimeter on a convex section.
 *
 * @evidence contracts/common.md#principled-implementation A plane cuts a triangle exactly when its corners lie on both sides, edge crossings are interpolated linearly and keyed by their edge so neighbours share them, the loop is walked through those keys, and the tape girth is the convex hull perimeter of the planar loop (Andrew's monotone chain). On-plane vertices count positive, admitting endpoint crossings while retaining two crossing edge keys per straddling triangle. The optional triangle list only narrows which triangles are read and must contain every straddler in ascending order; the result is then identical to a full walk.
 * @evidence contracts/common.md#clear-and-simple-design One responsibility: the cut of a triangle surface by a plane and the loop nearest a seed. The plane, the seed and the candidate triangles are the caller's; no anatomy is held here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No landmark, rule or expected girth is named, and the candidate list is only a narrowing of the same exact test.
 * @evidence contracts/common.md#meaningful-documentation The comment states the method, the loop selection, the tape convention, the null answers, the cost and the candidate-list contract.
 * @evidence contracts/modeling.md#spatial-conventions Positions, plane and results are metres in the frame of the surface the caller passes, and the body faces +Z; the only conversion is the named orthonormal plane frame used for the hull.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function measures a section and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry, only measurements of a section.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function holds no anatomy; the rule that places the plane carries the source.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is not an input through which a caller shapes a body.
 */
export function measureHumanSection(
  positions: number[],
  indices: number[],
  plane: IAutoMovieHumanSectionPlane,
  seed: IAutoMovieVector3,
  triangles?: readonly number[],
  physicalVertices?: IAutoMovieMesh["physicalVertices"],
): IAutoMovieHumanSectionReading | null {
  const count = positions.length / 3;
  const physical =
    physicalVertices === undefined
      ? undefined
      : resolveAutoMovieMeshPhysicalVertices({ positions, physicalVertices });
  const distance = new Float64Array(count);
  const measure = (v: number): void => {
    distance[v] =
      (positions[v * 3] - plane.point.x) * plane.normal.x +
      (positions[v * 3 + 1] - plane.point.y) * plane.normal.y +
      (positions[v * 3 + 2] - plane.point.z) * plane.normal.z;
  };
  // only the vertices a walked triangle reads are measured; the rest of the
  // buffer stays zero and is never read
  if (triangles === undefined) for (let v = 0; v < count; v++) measure(v);
  else
    for (const t of triangles)
      for (let k = 0; k < 3; k++) measure(indices[t * 3 + k]);
  const points = new Map<string, [number, number, number]>();
  const adjacency = new Map<string, string[]>();
  const crossing = (a: number, b: number): string => {
    const first = physical?.vertices[a] ?? a;
    const second = physical?.vertices[b] ?? b;
    const key = first < second ? first + "/" + second : second + "/" + first;
    if (!points.has(key)) {
      const t = distance[a] / (distance[a] - distance[b]);
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
  const walked = triangles?.length ?? indices.length / 3;
  for (let step = 0; step < walked; step++) {
    const t = (triangles === undefined ? step : triangles[step]) * 3;
    const keys: string[] = [];
    for (let k = 0; k < 3; k++) {
      const a = indices[t + k];
      const b = indices[t + ((k + 1) % 3)];
      if (distance[a] >= 0 !== distance[b] >= 0) keys.push(crossing(a, b));
    }
    if (keys.length !== 2) continue;
    for (const [from, to] of [
      [keys[0], keys[1]],
      [keys[1], keys[0]],
    ]) {
      const list = adjacency.get(from);
      if (list === undefined) adjacency.set(from, [to]);
      else list.push(to);
    }
  }
  const visited = new Set<string>();
  // an orthonormal frame of the plane, for the hull
  const n = plane.normal;
  const helper =
    Math.abs(n.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  const u = normalize(Vector3.cross(n, helper));
  const w = Vector3.cross(n, u);
  let best: IAutoMovieHumanSectionReading | null = null;
  let bestDistance = Infinity;
  for (const start of adjacency.keys()) {
    if (visited.has(start)) continue;
    const loop = [start];
    visited.add(start);
    let previous = start;
    let current = adjacency.get(start)![0];
    while (!visited.has(current)) {
      visited.add(current);
      loop.push(current);
      const next = adjacency.get(current)!.find((key) => key !== previous);
      if (next === undefined) break;
      previous = current;
      current = next;
    }
    // The walk closes only when it returns to the start; a chain that ends at
    // a boundary crossing stops at a key with one neighbour and is not a girth.
    if (current !== start || loop.length < 3) continue;
    let perimeter = 0,
      minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      cx = 0,
      cy = 0,
      cz = 0;
    for (let i = 0; i < loop.length; i++) {
      const p = points.get(loop[i])!;
      const q = points.get(loop[(i + 1) % loop.length])!;
      perimeter += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minZ = Math.min(minZ, p[2]);
      cx += p[0];
      cy += p[1];
      cz += p[2];
    }
    const centroid = {
      x: cx / loop.length,
      y: cy / loop.length,
      z: cz / loop.length,
    };
    const gap = Math.hypot(
      centroid.x - seed.x,
      centroid.y - seed.y,
      centroid.z - seed.z,
    );
    if (gap < bestDistance) {
      bestDistance = gap;
      // The tape girth is the perimeter of the loop's convex hull in the
      // plane frame (u, w), carried in the hull owner's x and z.
      const hull = convexHull2D(
        loop.map((key) => {
          const p = points.get(key)!;
          return {
            x: p[0] * u.x + p[1] * u.y + p[2] * u.z,
            y: 0,
            z: p[0] * w.x + p[1] * w.y + p[2] * w.z,
          };
        }),
      );
      let girth = 0;
      for (let i = 0; i < hull.length; i++) {
        const p = hull[i];
        const q = hull[(i + 1) % hull.length];
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
  const size = Math.hypot(a.x, a.y, a.z);
  return { x: a.x / size, y: a.y / size, z: a.z / size };
}
