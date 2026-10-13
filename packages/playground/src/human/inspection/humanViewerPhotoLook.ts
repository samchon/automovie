import type { IHumanCaptureCamera } from "@automovie/viewer/human/common/observation/IHumanCaptureCamera";
import type { HumanViewerAddress } from "@automovie/viewer/human/inspection/HumanViewerAddress";

/**
 * The `look` field that places the camera where a photograph was taken: yaw,
 * pitch, distance, target and field of view, the 28 degrees of the review
 * captures when the photograph recorded none. It only copies the recorded
 * pose; it fits nothing to the photograph, so the difference that remains is
 * what the comparison is for.
 *
 * @evidence contracts/common.md#principled-implementation Copies recorded yaw, pitch, distance, target and field of view into the address tuple, using the declared 28-degree review-camera default only when FOV is absent.
 * @evidence contracts/common.md#clear-and-simple-design One transport mapping owns tuple order; photograph fitting and model construction remain outside the camera-address conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The photographed pose remains supplied data and the declared missing-FOV default does not infer a camera fit or improve a subject's likeness.
 * @evidence contracts/common.md#meaningful-documentation Names camera components, copied-target order, degree default and the distinction between pose replay and photograph fitting.
 */
export function humanViewerPhotoLook(
  camera: IHumanCaptureCamera,
): NonNullable<HumanViewerAddress["look"]> {
  return [
    camera.yaw,
    camera.pitch,
    camera.distance,
    camera.target[0],
    camera.target[1],
    camera.target[2],
    camera.fov ?? 28,
  ];
}
