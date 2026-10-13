import type { IHumanCaptureCamera } from "@automovie/viewer/human/common/observation/IHumanCaptureCamera";
import type { HumanViewerAddress } from "@automovie/viewer/human/inspection/HumanViewerAddress";

/**
 * The `look` field that places the camera where a photograph was taken: yaw, pitch, distance, target and field of view, the 28 degrees of the review captures when the photograph recorded none. It only copies the recorded pose; it fits nothing to the photograph, so the difference that remains is what the comparison is for.
 *
 * @evidence contracts/common.md#principled-implementation The seven-element look tuple copies supplied yaw, pitch, distance, target and optional field of view, preserving recorded pose while applying the established 28-degree review default only when fov is absent.
 * @evidence contracts/common.md#clear-and-simple-design This camera projection performs no photo fitting or model mutation; address and viewport owners interpret the returned observation tuple.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No photograph-derived geometry or fitted camera correction is invented, and the absent-fov default is identified as review presentation convention rather than recorded evidence.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies copied camera fields, 28-degree fallback and preservation of the photograph comparison difference.
 * @evidence contracts/performance.md#efficient-algorithms Copying seven scalar coordinates costs constant time and one fixed tuple independent of photo or mesh dimensions.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure projection coordinates no cached photo fitting or numerical model work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned scalar tuple retains no photograph bytes, camera handle or renderer resource.
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
