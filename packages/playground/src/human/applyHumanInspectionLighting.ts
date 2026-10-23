import * as THREE from "three";

import type { HumanCaptureCamera } from "./HumanCaptureCamera";
import type { normalizeHumanView } from "./normalizeHumanView";

/**
 * Place the page's existing lights for a reference or raking inspection draw.
 *
 * The reference profile retains camera-space offset (1, 1.4, 0.7), key 2.2
 * and hemisphere 0.6. Raking profiles use (left/right 1, 0.2, 0.1), key 2.2
 * and hemisphere 0.08: a conventional grazing inspection light, not a fitted
 * anatomical quantity. The offset is scaled by the whole-model diagonal;
 * directional light position controls direction rather than attenuation.
 *
 * @param key Existing directional light, never replaced.
 * @param hemisphere Existing hemisphere light, never replaced.
 * @param camera Camera whose axes define the lighting profile.
 * @param target Look-at target in model metres.
 * @param diagonal Whole-model diagonal in metres.
 * @param mode Parsed inspection profile; reference is the unchanged default.
 * @returns Actual directional-light values for the capture receipt.
 *
 * @evidence contracts/common.md#principled-implementation Transforms one declared camera-space vector by the actual camera quaternion, places the existing key about the actual target and sets the declared key and ambient intensities; geometry and camera placement are untouched.
 * @evidence contracts/common.md#clear-and-simple-design One function supplies interactive following and PNG drawing, so the same profile has one lighting authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Profiles are explicit inspection conditions, never specimen-specific corrections; the reference profile preserves the existing constants.
 * @evidence contracts/common.md#meaningful-documentation States units, frame, the conventional raking values, default conditions, borrowed lights and actual-value receipt output.
 * @evidence contracts/performance.md#efficient-algorithms Constant vector and matrix work per draw with a few temporary vectors and output arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the page's lights and camera for both interaction and capture instead of building another scene or renderer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows all scene resources; temporary vectors and the caller-owned metadata arrays are the only allocations and no state is retained.
 */
export function applyHumanInspectionLighting(
  key: THREE.DirectionalLight,
  hemisphere: THREE.HemisphereLight,
  camera: THREE.Camera,
  target: THREE.Vector3,
  diagonal: number,
  mode: normalizeHumanView.IView["light"],
): HumanCaptureCamera.IPlacement["light"] {
  camera.updateMatrixWorld();
  const offset: THREE.Vector3 =
    mode === "reference"
      ? new THREE.Vector3(1, 1.4, 0.7)
      : new THREE.Vector3(mode === "raking-left" ? -1 : 1, 0.2, 0.1);
  key.position
    .copy(target)
    .add(offset.applyQuaternion(camera.quaternion).multiplyScalar(diagonal));
  key.target.position.copy(target);
  key.target.updateMatrixWorld();
  key.intensity = 2.2;
  hemisphere.intensity = mode === "reference" ? 0.6 : 0.08;
  return {
    position: key.position.toArray(),
    target: key.target.position.toArray(),
    intensity: key.intensity,
  };
}
