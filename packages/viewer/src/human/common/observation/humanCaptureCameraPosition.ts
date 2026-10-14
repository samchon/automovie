import type { IHumanCaptureCamera } from "./IHumanCaptureCamera.js";

/**
 * Place a recorded camera eye around its target in the Y-up metre frame.
 * The spherical direction is `(cos(p) sin(y), sin(p), cos(p) cos(y))`;
 * eye placement is independent of viewport resolution and field of view.
 * The caller admits finite angles, positive distance and finite target values.
 *
 * @evidence contracts/common.md#principled-implementation Converts degrees to radians and adds distance times the spherical Y-up direction to the metre target. Finite admitted angles, positive distance and representable target sums are caller premises; extreme finite values can still overflow ordinary trigonometric conversion/addition.
 * @evidence contracts/common.md#clear-and-simple-design One numerical eye-placement law is shared by capture and display consumers, separate from lens, resolution and native camera mutation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied recorded angles are used directly without nearest-view snapping or a fixture pose correction. Numerical placement alone establishes no photographic correspondence.
 * @evidence contracts/common.md#meaningful-documentation The comment states coordinate frame, spherical formula, independent field-of-view role and caller admission, while IHumanCaptureCamera documents signs and units.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of trigonometric operations and three sums require constant work and one tuple output.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers share this canonical formula, but different targets/distances/angles receive fresh calculation rather than a view-name cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new numerical tuple and retains no record, camera or renderer; native camera lifetime remains with the consuming viewport.
 */
export function humanCaptureCameraPosition(
  camera: IHumanCaptureCamera,
): [number, number, number] {
  const yaw: number = camera.yaw * Math.PI / 180;
  const pitch: number = camera.pitch * Math.PI / 180;
  return [
    camera.target[0] + camera.distance * Math.cos(pitch) * Math.sin(yaw),
    camera.target[1] + camera.distance * Math.sin(pitch),
    camera.target[2] + camera.distance * Math.cos(pitch) * Math.cos(yaw),
  ];
}
