import * as THREE from "three";

/**
 * Frame exact displayed mesh identities from their world-space geometry, in
 * metres. This selects existing output, never edits a numerical document.
 * Matrix updates refresh derived display transforms before bounding vertices.
 * Missing names, empty populations and collapsed geometry refuse explicitly.
 * Neighbouring meshes affect an assembled selection only when requested.
 *
 * @evidence contracts/common.md#principled-implementation The union of selected transformed vertex bounds encloses precisely the requested displayed meshes.
 * @evidence contracts/common.md#clear-and-simple-design One geometry query owns automatic part framing for gallery and HTTP captures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bounds come from actual emitted meshes without anatomical hardcoded centres or subject cases.
 * @evidence contracts/common.md#meaningful-documentation Defines metre units, display-transform mutation and explicit degeneracy refusal.
 * @evidence contracts/modeling.md#spatial-conventions Returns centre and radius in the scene's metre-based world frame after applying mesh transforms.
 */
export function frameHumanViewerParts(root: THREE.Object3D, names: readonly string[]):
  { center: [number, number, number]; radius: number } {
  const selected = new Set(names);
  const found = new Set<string>();
  const bounds = new THREE.Box3();
  root.updateWorldMatrix(true, true);
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || (selected.size !== 0 && !selected.has(mesh.name))) return;
    found.add(mesh.name);
    bounds.expandByObject(mesh, true);
  });
  if (names.some((name) => !found.has(name))) throw new Error("A selected part is not displayed");
  if (bounds.isEmpty()) throw new Error("No displayed geometry to frame");
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  if (!Number.isFinite(sphere.radius) || sphere.radius <= 0) throw new Error("Part geometry is collapsed or nonfinite");
  return { center: sphere.center.toArray(), radius: sphere.radius };
}
