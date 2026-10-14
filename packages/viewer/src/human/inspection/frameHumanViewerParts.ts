import * as THREE from "three";
import {isHumanObservationAuxiliary} from "../common/observation/isHumanObservationAuxiliary.js";

/**
 * Frame selected resident mesh subtrees from world-space geometry in metres, preserving numerical documents. World matrices update before precise bounding; missing names, empty selections and collapsed geometry refuse. Auxiliary mesh roots are skipped, but Three expandByObject recursively includes descendants of a selected mesh, which may include auxiliary children. Overlapping selected subtrees can revisit vertices. This is distinct from renderer visibility, layers and frustum admission.
 *
 * @evidence contracts/common.md#principled-implementation Exact resident names select updated mesh subtrees for Three's precise bounds; auxiliary roots are skipped while selected descendants remain included, and missing/empty/collapsed selection refuses.
 * @evidence contracts/common.md#clear-and-simple-design Selected/found name sets and one bounding box produce the camera frame without editing numerical documents or creating alternate geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite or zero-radius geometry refuses instead of inventing a camera extent; resident bounding is explicitly distinct from renderer visibility/layer/culling admission.
 * @evidence contracts/common.md#meaningful-documentation Documentation defines metres, resident subtree geometry, auxiliary-root versus descendant behavior, repeated subtree work and separation from submitted draws.
 * @evidence contracts/performance.md#efficient-algorithms One outer traversal checks selected names, then each matched mesh expands its subtree; cost includes all recursive descendant/vertex visits and can repeat under overlapping selections, followed by a missing-name scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current world transforms and geometry bounds are observed for each framing request rather than reusing an earlier pose's extent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Name sets and bounds remain invocation-local; the root is borrowed and no mesh, GPU buffer or observer lifetime is acquired.
 */
export function frameHumanViewerParts(
  root: THREE.Object3D,
  names: readonly string[],
): { center: [number, number, number]; radius: number } {
  const selected: Set<string> = new Set(names);
  const found: Set<string> = new Set();
  const bounds: THREE.Box3 = new THREE.Box3();
  root.updateWorldMatrix(true, true);
  root.traverse((object: THREE.Object3D): void => {
    const mesh: THREE.Mesh = object as THREE.Mesh;
    if (!mesh.isMesh || isHumanObservationAuxiliary(mesh) || (selected.size !== 0 && !selected.has(mesh.name)))
      return;
    found.add(mesh.name);
    bounds.expandByObject(mesh, true);
  });
  if (names.some((name: string): boolean => !found.has(name)))
    throw new Error("A selected part is not displayed");
  if (bounds.isEmpty()) throw new Error("No displayed geometry to frame");
  const sphere: THREE.Sphere = bounds.getBoundingSphere(new THREE.Sphere());
  if (!Number.isFinite(sphere.radius) || sphere.radius <= 0)
    throw new Error("Part geometry is collapsed or nonfinite");
  return { center: sphere.center.toArray(), radius: sphere.radius };
}
