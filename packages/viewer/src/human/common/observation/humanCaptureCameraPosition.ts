import type { IHumanCaptureCamera } from "./IHumanCaptureCamera.js";

/**
 * Place a recorded camera eye around its target in the Y-up metre frame.
 * The spherical direction is `(cos(p) sin(y), sin(p), cos(p) cos(y))`;
 * eye placement is independent of viewport resolution and field of view.
 * The caller admits finite angles, positive distance and finite target values.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Reproduces an admitted recorded viewing direction around the displayed model.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Applies the recorded metre-scale camera without fitting the numerical asset to an image.
 */
export function humanCaptureCameraPosition(
  camera: IHumanCaptureCamera,
): [number, number, number] {
  const yaw = camera.yaw * Math.PI / 180;
  const pitch = camera.pitch * Math.PI / 180;
  return [
    camera.target[0] + camera.distance * Math.cos(pitch) * Math.sin(yaw),
    camera.target[1] + camera.distance * Math.sin(pitch),
    camera.target[2] + camera.distance * Math.cos(pitch) * Math.cos(yaw),
  ];
}
