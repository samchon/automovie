import type { IHumanCaptureCamera } from "@automovie/viewer/human/common/observation/IHumanCaptureCamera";

/**
 * The photograph a document is compared with, and how to place the camera like it.
 *
 * @evidence contracts/common.md#principled-implementation A local photograph reference carries its optional acquisition camera and unit-image landmarks independently of a model document.
 * @evidence contracts/common.md#clear-and-simple-design Only supported local folders, a plain image name, camera and marker observations are transported.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reference describes an existing image and does not fit subject geometry or manufacture acquisition metadata.
 * @evidence contracts/common.md#meaningful-documentation The camera can be absent and landmarks empty; paths remain plain names inside the selected reference folder.
 *
 * @author Samchon
 */
export interface IHumanViewerReference {
  /**
   * Folder and file name of the photograph, always a plain name inside the reference folder.
   */
  folder: "" | "body";

  /** Plain image file name inside the selected local reference folder. */
  file: string;

  /**
   * The camera the photograph was taken from, or null when none was recorded.
   */
  camera: IHumanCaptureCamera | null;

  /**
   * Observed landmarks in unit image coordinates, empty when none were recorded.
   */
  landmarks: { x: number; y: number; group: string }[];
}
