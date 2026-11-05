import * as THREE from "three";

/**
 * Intersect an explicit local ray with the actual emitted mesh triangles.
 * Returned point and normal are mesh-local; the normal faces the ray origin.
 *
 * @evidence contracts/common.md#implementation-and-ownership Three's ray/triangle operation reads actual indexed or nonindexed position vertices without replacing them by an AABB. Nearest positive hit supplies a reproducible surface point; absent intersections throw. No geometry is mutated or retained.
 * @evidence contracts/common.md#authoring-interface Supply a geometry-bearing mesh, finite local origin and nonzero local direction. Returns an owned point/normal and triangle ordinal. The caller owns local/world conversion and whether this particular surface is an appropriate anatomical contact; a ray hit alone proves no physical support.
 */
export function meshSurfacePoint(mesh: THREE.Mesh, origin: THREE.Vector3, direction: THREE.Vector3): {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  triangle: number;
} {
  if (![...origin.toArray(), ...direction.toArray()].every(Number.isFinite) || direction.lengthSq() === 0)
    throw new Error("Surface ray requires finite origin and nonzero direction");
  const positions: THREE.BufferAttribute = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
  const indices: THREE.BufferAttribute | null = mesh.geometry.getIndex();
  const count: number = indices?.count ?? positions.count;
  const ray: THREE.Ray = new THREE.Ray(origin.clone(), direction.clone().normalize());
  let nearest: { point: THREE.Vector3; normal: THREE.Vector3; triangle: number } | undefined;
  let distance: number = Infinity;
  for (let offset: number = 0; offset + 2 < count; offset += 3) {
    const vertices: THREE.Vector3[] = [0, 1, 2].map((step: number): THREE.Vector3 => {
      const index: number = indices ? indices.getX(offset + step) : offset + step;
      return new THREE.Vector3().fromBufferAttribute(positions, index);
    });
    const hit: THREE.Vector3 | null = ray.intersectTriangle(vertices[0]!, vertices[1]!, vertices[2]!, false, new THREE.Vector3());
    if (!hit || hit.distanceToSquared(origin) >= distance) continue;
    const normal: THREE.Vector3 = new THREE.Triangle(vertices[0]!, vertices[1]!, vertices[2]!).getNormal(new THREE.Vector3());
    if (normal.dot(ray.direction) > 0) normal.negate();
    distance = hit.distanceToSquared(origin);
    nearest = { point: hit, normal, triangle: offset / 3 };
  }
  if (!nearest) throw new Error(`Surface ray missed ${mesh.name || "mesh"}`);
  return nearest;
}
