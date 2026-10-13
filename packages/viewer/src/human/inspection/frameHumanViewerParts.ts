import * as THREE from "three";
import {isHumanObservationAuxiliary} from "../common/observation/isHumanObservationAuxiliary.js";

/**
 * Frame exact displayed mesh identities from their world-space geometry, in
 * metres. This selects existing output, never edits a numerical document.
 * Matrix updates refresh derived display transforms before bounding vertices.
 * Missing names, empty populations and collapsed geometry refuse explicitly.
 * Neighbouring meshes affect an assembled selection only when requested.
 */
export function frameHumanViewerParts(
  root: THREE.Object3D,
  names: readonly string[],
): { center: [number, number, number]; radius: number } {
  const selected = new Set(names);
  const found = new Set<string>();
  const bounds = new THREE.Box3();
  root.updateWorldMatrix(true, true);
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || isHumanObservationAuxiliary(mesh) || (selected.size !== 0 && !selected.has(mesh.name)))
      return;
    found.add(mesh.name);
    bounds.expandByObject(mesh, true);
  });
  if (names.some((name) => !found.has(name)))
    throw new Error("A selected part is not displayed");
  if (bounds.isEmpty()) throw new Error("No displayed geometry to frame");
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  if (!Number.isFinite(sphere.radius) || sphere.radius <= 0)
    throw new Error("Part geometry is collapsed or nonfinite");
  return { center: sphere.center.toArray(), radius: sphere.radius };
}
