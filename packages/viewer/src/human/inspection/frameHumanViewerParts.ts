import * as THREE from "three";
import {isHumanObservationAuxiliary} from "../common/observation/isHumanObservationAuxiliary.js";

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
 * @evidence contracts/modeling.md#part-identity-and-grouping Exact existing subject mesh names define the selection; the shared auxiliary predicate removes instrumentation before whole-subject bounds are measured.
 * @evidence contracts/modeling.md#parameter-channels The exact-name list selects already displayed meshes; an empty list selects the assembled subject and changes no numerical or anatomical parameter.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The query reads transformed emitted positions to derive one bounding sphere and creates no primitives or alternate mesh representation.
 * @evidenceExclude contracts/modeling.md#shared-boundaries World-matrix refresh and bounds measurement construct no surface join and leave vertex topology and shared numerical boundaries untouched.
 * @evidence contracts/modeling.md#rendered-observation The query supplies measured bounds to the camera owner rather than rendering a part; the actual viewport/capture owns the observed image and no whole-body appearance is certified here.
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
