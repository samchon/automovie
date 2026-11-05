import * as THREE from "three";

/**
 * Address an original palmar finger patch away from either joint seam.
 *
 * @evidence contracts/common.md#implementation-and-ownership Intersects the original indexed/nonindexed triangles with one finite local ray through an explicitly chosen anatomical segment fraction. It selects the nearest actual surface hit, not a mesh extreme that could belong to a joint seam. The caller supplies bind-relative span and the actual palmar or radial-side reference; its ray rotation is an authored landmark choice, not altered geometry or proof transferred from another model.
 * @evidence contracts/common.md#authoring-interface All vectors are mesh-bind metres. span runs from this joint to its actual child joint or leaf tip; outward addresses the anatomical surface side. fraction lies within65–85percent, with rayDegrees around the segment. Returns original triangle, rigid local point, ray-facing outward normal and agreement with that stated surface side. Missed/degenerate patches refuse. Actual finite contact and hand clearance belong to the consumer.
 */
export function selectFingerPad(mesh: THREE.Mesh, span: THREE.Vector3, outward: THREE.Vector3, fraction: number, rayDegrees: number): {
  point: THREE.Vector3; normal: THREE.Vector3; triangle: number; fraction: number; surfaceAgreement: number;
} {
  if (![...span.toArray(), ...outward.toArray(), fraction, rayDegrees].every(Number.isFinite) || span.lengthSq() <= 1e-12 || fraction < 0.65 || fraction > 0.85)
    throw new Error("Finger patch requires a finite anatomical span and65–85percent address");
  const axis: THREE.Vector3 = span.clone().normalize();
  const volar: THREE.Vector3 = outward.clone().addScaledVector(axis, -outward.dot(axis));
  if (volar.lengthSq() <= 1e-12) throw new Error("Finger patch needs an independent palmar direction");
  volar.normalize();
  const direction: THREE.Vector3 = volar.clone().applyAxisAngle(axis, THREE.MathUtils.degToRad(rayDegrees));
  const origin: THREE.Vector3 = span.clone().multiplyScalar(fraction).addScaledVector(direction, 0.06);
  const ray: THREE.Ray = new THREE.Ray(origin, direction.clone().negate());
  const positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
  const indices: THREE.BufferAttribute | null = mesh.geometry.getIndex();
  let selected: { point: THREE.Vector3; normal: THREE.Vector3; triangle: number; distance: number } | undefined;
  for (let offset: number = 0; offset < (indices?.count ?? positions.count); offset += 3) {
    const vertices: THREE.Vector3[] = [0, 1, 2].map((step: number): THREE.Vector3 => new THREE.Vector3().fromBufferAttribute(positions, indices?.getX(offset + step) ?? offset + step));
    const hit: THREE.Vector3 | null = ray.intersectTriangle(vertices[0]!, vertices[1]!, vertices[2]!, false, new THREE.Vector3());
    if (hit === null) continue;
    const distance: number = hit.distanceToSquared(origin);
    if (selected !== undefined && distance >= selected.distance) continue;
    const normal: THREE.Vector3 = new THREE.Triangle(vertices[0]!, vertices[1]!, vertices[2]!).getNormal(new THREE.Vector3());
    if (normal.dot(direction) < 0) normal.negate();
    selected = { point: hit, normal, triangle: offset / 3, distance };
  }
  if (selected === undefined) throw new Error("Original finger patch ray missed its source skin");
  return { point: selected.point, normal: selected.normal, triangle: selected.triangle, fraction: selected.point.dot(span) / span.lengthSq(), surfaceAgreement: selected.normal.dot(volar) };
}
