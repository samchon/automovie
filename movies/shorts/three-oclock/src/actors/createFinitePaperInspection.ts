import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import * as THREE from "three";

/**
 * Inspect original skin triangles against the actual finite rectangular note.
 *
 * @evidence contracts/common.md#implementation-and-ownership Reuses the installed nearest-feature signed query on each unchanged closed skin part. In the paper frame, every original triangle is tested against the box interior with THREE's triangle/box separating-axis test; paper corners and centre are also queried against each original solid to detect complete containment without a surface crossing. A convex hull or overlapping AABB never declares penetration. A subnanometre boundary exclusion distinguishes touching from interior intersection and is not the three-millimetre contact allowance. Query admission errors stay unresolved. No geometry, rig or pose is changed.
 * @evidence contracts/common.md#authoring-interface Prepare named original part geometries once, then supply the actual finite paper geometry/world matrix and one matching rigid world matrix per part, all in metres. Returns the complete crossing/containment population and any unresolved query error. The caller owns all geometry; the closure retains immutable query snapshots and references only. This discrete test proves neither swept clearance nor force/friction.
 */
export function createFinitePaperInspection(parts: readonly { name: string; geometry: THREE.BufferGeometry }[]): (paper: THREE.BufferGeometry, world: THREE.Matrix4, transforms: ReadonlyMap<string, THREE.Matrix4>) => {
  certified: boolean; intersections: number; containments: number; testedTriangles: number; parts: { name: string; intersections: number; containments: number }[]; errors: string[];
} {
  const prepared: { name: string; geometry: THREE.BufferGeometry; query?: ReturnType<typeof createAutoMovieSignedMeshQuery>; error?: string }[] = parts.map((part: { name: string; geometry: THREE.BufferGeometry }): { name: string; geometry: THREE.BufferGeometry; query?: ReturnType<typeof createAutoMovieSignedMeshQuery>; error?: string } => {
    try {
      const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = part.geometry.getAttribute("position");
      const positions: number[] = [];
      for (let index: number = 0; index < position.count; index++) positions.push(position.getX(index), position.getY(index), position.getZ(index));
      return { ...part, query: createAutoMovieSignedMeshQuery({ positions, indices: part.geometry.index === null ? null : Array.from(part.geometry.index.array), normals: null, uvs: null, skin: null }) };
    } catch (error) { return { ...part, error: error instanceof Error ? error.message : String(error) }; }
  });
  return (paper: THREE.BufferGeometry, world: THREE.Matrix4, transforms: ReadonlyMap<string, THREE.Matrix4>): ReturnType<ReturnType<typeof createFinitePaperInspection>> => {
    paper.computeBoundingBox();
    const bounds: THREE.Box3 = paper.boundingBox!;
    const inner: THREE.Box3 = bounds.clone().expandByScalar(-1e-10);
    const inverse: THREE.Matrix4 = world.clone().invert();
    const probes: THREE.Vector3[] = [bounds.getCenter(new THREE.Vector3()).applyMatrix4(world)];
    for (let index: number = 0; index < 8; index++) probes.push(new THREE.Vector3(index & 1 ? bounds.max.x : bounds.min.x, index & 2 ? bounds.max.y : bounds.min.y, index & 4 ? bounds.max.z : bounds.min.z).applyMatrix4(world));
    const result: ReturnType<ReturnType<typeof createFinitePaperInspection>> = { certified: true, intersections: 0, containments: 0, testedTriangles: 0, parts: [], errors: [] };
    for (const part of prepared) {
      const transform: THREE.Matrix4 | undefined = transforms.get(part.name);
      if (transform === undefined || part.query === undefined) { result.errors.push(`${part.name}:${part.error ?? "missing matching rigid transform"}`); continue; }
      const matrix: THREE.Matrix4 = inverse.clone().multiply(transform);
      const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = part.geometry.getAttribute("position");
      const index: THREE.BufferAttribute | null = part.geometry.getIndex();
      const points: THREE.Vector3[] = Array.from({ length: attribute.count }, (_: unknown, at: number): THREE.Vector3 => new THREE.Vector3().fromBufferAttribute(attribute, at).applyMatrix4(matrix));
      const box: THREE.Box3 = new THREE.Box3().setFromPoints(points);
      if (!inner.intersectsBox(box)) continue;
      let intersections: number = 0;
      let containments: number = 0;
      for (let at: number = 0; at < (index?.count ?? attribute.count); at += 3) {
        const triangle: THREE.Triangle = new THREE.Triangle(points[index?.getX(at) ?? at]!, points[index?.getX(at + 1) ?? at + 1]!, points[index?.getX(at + 2) ?? at + 2]!);
        result.testedTriangles++;
        if (inner.intersectsTriangle(triangle)) intersections++;
      }
      const local: THREE.Matrix4 = transform.clone().invert();
      for (const probe of probes) if (part.query(probe.clone().applyMatrix4(local).toArray()).signedDistance < -1e-10) containments++;
      if (intersections !== 0 || containments !== 0) result.parts.push({ name: part.name, intersections, containments });
      result.intersections += intersections; result.containments += containments;
    }
    result.certified = result.intersections === 0 && result.containments === 0 && result.errors.length === 0;
    return result;
  };
}
