import * as THREE from "three";

/**
 * Select an actual emitted hand vertex nearest its forward middle surface.
 *
 * @evidence contracts/common.md#implementation-and-ownership The fixed drawing's real hand geometry supplies the witness. A nearest-vertex query against the forward face's middle selects an existing point rather than inventing skin at the wrist centre or treating a bounding box corner as a surface. This is one coarse contact witness, not a full palm collision model.
 * @evidence contracts/common.md#authoring-interface Supply the actual hand mesh in its registered bind-relative bone frame. Return one owned metre tuple usable as ClinicalIk localPoint. Empty/nonfinite geometry refuses. The caller must verify grip orientation, fingers and other collisions through the real moving scene.
 */
export function selectDuelPalmPoint(mesh: THREE.Mesh): [number, number, number] {
  const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
  if (attribute === undefined || attribute.count === 0) throw new Error("Palm witness requires actual emitted vertices");
  mesh.geometry.computeBoundingBox();
  const box: THREE.Box3 = mesh.geometry.boundingBox!;
  const target: THREE.Vector3 = box.getCenter(new THREE.Vector3());
  target.x = box.max.x;
  const point: THREE.Vector3 = new THREE.Vector3();
  let nearest: number = Infinity;
  let result: [number, number, number] | undefined;
  for (let index: number = 0; index < attribute.count; index++) {
    point.set(attribute.getX(index), attribute.getY(index), attribute.getZ(index));
    if (!point.toArray().every(Number.isFinite)) throw new Error("Palm geometry contains a nonfinite point");
    const distance: number = point.distanceToSquared(target);
    if (distance < nearest) { nearest = distance; result = [point.x, point.y, point.z]; }
  }
  if (result === undefined) throw new Error("No actual palm vertex selected");
  return result;
}
