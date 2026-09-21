
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 as Point } from "@automovie/interface";
import { buildPortraitPerformanceGlobe } from "./buildPortraitPerformanceGlobe";
import { portraitNormals } from "../../mesh/portraitNormals";
import { portraitRegion } from "../../mesh/portraitRegion";
import type { IPortraitEyeSphere } from "../../surface/structures/IPortraitEyeSphere";
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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Connects separately fixed canthi to a resident optical body without enlarging that body.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Shares the emitted convex support faces between drawing and directional lid contact.
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
    anchors.some((p) => ![p.x, p.y, p.z].every(Number.isFinite))
  )
    throw new Error("Canthal support needs two finite anchors.");
  const globe = buildPortraitPerformanceGlobe(sphere, columns, rows);
  const positions = [...globe.positions];
  const opticalCount = positions.length / 3;
  let indices = [...globe.indices!];
  const point = (id: number): Point =>
    Vector3.create(
      ...(positions.slice(3 * id, 3 * id + 3) as [number, number, number]),
    );
  for (const anchor of anchors) {
    const retained: number[] = [];
    const horizon = new Map<string, [number, number]>();
    for (let i = 0; i < indices.length; i += 3) {
      const face = indices.slice(i, i + 3);
      const a = point(face[0]);
      const normal = Vector3.cross(
        Vector3.subtract(point(face[1]), a),
        Vector3.subtract(point(face[2]), a),
      );
      const distance = Vector3.dot(normal, Vector3.subtract(anchor, a));
      if (distance <= 1e-12 * sphere.radius * Vector3.length(normal)) {
        retained.push(...face);
        continue;
      }
      for (let edge = 0; edge < 3; edge++) {
        const from = face[edge],
          to = face[(edge + 1) % 3];
        const opposite = `${to}/${from}`;
        if (horizon.has(opposite)) horizon.delete(opposite);
        else horizon.set(`${from}/${to}`, [from, to]);
      }
    }
    if (horizon.size === 0) continue;
    const id = positions.length / 3;
    positions.push(anchor.x, anchor.y, anchor.z);
    for (const [from, to] of horizon.values()) retained.push(from, to, id);
    indices = retained;
  }
  // Keep the exact optical normals at shared globe vertices. Newly introduced
  // apices have no analytic unique normal, so use their incident face average.
  const normals = portraitNormals(positions, indices);
  normals.splice(0, globe.normals!.length, ...globe.normals!);
  const surface = portraitRegion(positions, normals, indices);
  const connective = (i: number): boolean => {
    const face = Math.floor(i / 3) * 3;
    return indices.slice(face, face + 3).some((id) => id >= opticalCount);
  };
  // The visible boundary is the hull, not the old globe plus a second cap.
  // Retaining buried globe faces at a shared horizon would create three
  // incident faces after the exporter's geometric weld. Partition this one
  // external boundary by tissue ownership; both parts retain its exact normals.
  const exposed = portraitRegion(
    positions,
    normals,
    indices.filter((_id, i) => !connective(i)),
  );
  const extension = portraitRegion(
    positions,
    normals,
    indices.filter((_id, i) => connective(i)),
  );
  return { globe, exposed, extension, surface };
}