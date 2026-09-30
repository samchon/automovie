import type { IFaceLikenessCamera } from "../face-review/faceLikenessFraming";
import type { HumanViewerAddress } from "./HumanViewerAddress";

/**
 * The `look` field that places the camera where a photograph was taken: yaw,
 * pitch, distance, target and field of view, the 28 degrees of the review
 * captures when the photograph recorded none. It only copies the recorded
 * pose; it fits nothing to the photograph, so the difference that remains is
 * what the comparison is for.
 */
export function humanViewerPhotoLook(
  camera: IFaceLikenessCamera,
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
