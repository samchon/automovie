import type { IHumanCaptureCamera } from "@automovie/viewer/human/common/observation/IHumanCaptureCamera";

/**
 * The photograph a document is compared with, and how to place the camera like it.
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
