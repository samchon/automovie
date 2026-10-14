import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieVector3 as Point,
} from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { extractTriangleRegion } from "../../mesh/extractTriangleRegion";
import type { IPortraitEyeSphere } from "../../surface/structures/IPortraitEyeSphere";
import { buildPortraitPerformanceGlobe } from "./buildPortraitPerformanceGlobe";

/**
 * Extend the actual sampled globe to fixed canthi by an incremental convex hull.
 * The eye component builds this immutable identity support before blink/gaze.
 * All inputs and returned meshes use construction millimetres. The complete
 * sphere remains the optical body; newly exposed hull faces are connective
 * tissue. Drawing and contact consume these same faces, not an analytic cone
 * sampled differently in each consumer. Changing sampling invalidates both.
 *
 * The initial latitude globe is a closed outward convex polyhedron. For each
 * exterior anchor, remove exactly the faces visible from it and connect their
 * oriented horizon to the new point. Interior/coplanar points leave the hull
 * unchanged. Appending the second anchor to the first hull also handles common
 * support planes where independent tangent cones would overlap. At finite
 * resolution these are planar faces; increasing sampling approaches tangent
 * sphere/cone continuity but cannot certify likeness or anatomical placement.
 *
 * @evidence contracts/common.md#principled-implementation Incremental visible-face/horizon insertion extends the actual sampled convex globe to two finite canthal anchors while preserving its external boundary.
 * @evidence contracts/common.md#clear-and-simple-design One completed hull is partitioned into optical and connective ownership; drawing/contact consume the same surface and retained optical normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Interior/coplanar anchors leave the hull unchanged under the declared radius-scaled predicate; finite resolution does not certify anatomy or likeness.
 * @evidence contracts/common.md#meaningful-documentation The prose states construction millimetres, fixed identity support, convex-input premise and sampling limitations.
 * @evidence contracts/performance.md#efficient-algorithms Two anchors each scan the current faces and horizon; normals and three region extractions are proportional to emitted incidence.
 * @evidence contracts/performance.md#reuse-equivalent-work The sampled globe and completed hull are shared across returned ownership regions, avoiding independently fitted tangent supports.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned region meshes own arrays; horizon/position/remap temporaries expire and no global hull cache or handle survives.
 */
export function buildPortraitCanthalMesh(
  sphere: IPortraitEyeSphere,
  anchors: readonly Point[],
  columns: number,
  rows: number,
): {
  globe: IAutoMovieMesh;
  exposed: IAutoMovieMesh;
  extension: IAutoMovieMesh;
  surface: IAutoMovieMesh;
} {
  if (
    anchors.length !== 2 ||
    anchors.some((p: Point): boolean  => ![p.x, p.y, p.z].every(Number.isFinite))
  )
    throw new Error("Canthal support needs two finite anchors.");
  const globe: IAutoMovieMesh = buildPortraitPerformanceGlobe(sphere, columns, rows);
  const positions: number[] = [...globe.positions];
  const opticalCount: number = positions.length / 3;
  let indices: number[] = [...globe.indices!];
  const point: (id: number) => Point = (id: number): Point =>
    Vector3.create(
      ...(positions.slice(3 * id, 3 * id + 3) as [number, number, number]),
    );
  for (const anchor of anchors) {
    const retained: number[] = [];
    const horizon: Map<string, [number, number]> = new Map<string, [number, number]>();
    for (let i: number = 0; i < indices.length; i += 3) {
      const face: number[] = indices.slice(i, i + 3);
      const a: Point = point(face[0]);
      const normal: Point = Vector3.cross(
        Vector3.subtract(point(face[1]), a),
        Vector3.subtract(point(face[2]), a),
      );
      const distance: number = Vector3.dot(normal, Vector3.subtract(anchor, a));
      if (distance <= 1e-12 * sphere.radius * Vector3.length(normal)) {
        retained.push(...face);
        continue;
      }
      for (let edge: number = 0; edge < 3; edge++) {
        const from: number = face[edge],
          to: number = face[(edge + 1) % 3];
        const opposite: string = `${to}/${from}`;
        if (horizon.has(opposite)) horizon.delete(opposite);
        else horizon.set(`${from}/${to}`, [from, to]);
      }
    }
    if (horizon.size === 0) continue;
    const id: number = positions.length / 3;
    positions.push(anchor.x, anchor.y, anchor.z);
    for (const [from, to] of horizon.values()) retained.push(from, to, id);
    indices = retained;
  }
  // Keep the exact optical normals at shared globe vertices. Newly introduced
  // apices have no analytic unique normal, so use their incident face average.
  const normals: number[] = areaWeightedNormals(positions, indices);
  normals.splice(0, globe.normals!.length, ...globe.normals!);
  const surface: IAutoMovieMesh = extractTriangleRegion(positions, normals, indices);
  const connective: (i: number) => boolean = (i: number): boolean => {
    const face: number = Math.floor(i / 3) * 3;
    return indices.slice(face, face + 3).some((id: number): boolean  => id >= opticalCount);
  };
  // The visible boundary is the hull, not the old globe plus a second cap.
  // Retaining buried globe faces at a shared horizon would create three
  // incident faces after the exporter's geometric weld. Partition this one
  // external boundary by tissue ownership; both parts retain its exact normals.
  const exposed: IAutoMovieMesh = extractTriangleRegion(
    positions,
    normals,
    indices.filter((_id: number, i: number): boolean  => !connective(i)),
  );
  const extension: IAutoMovieMesh = extractTriangleRegion(
    positions,
    normals,
    indices.filter((_id: number, i: number): boolean  => connective(i)),
  );
  return { globe, exposed, extension, surface };
}
