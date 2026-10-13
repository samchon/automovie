import type { IHumanCaptureCamera } from "@automovie/viewer/human/common/observation/IHumanCaptureCamera";

/**
 * The photograph a document is compared with, and how to place the camera like it.
 *
 * @evidence contracts/common.md#principled-implementation A local photograph reference carries its optional acquisition camera and unit-image landmarks independently of a model document.
 * @evidence contracts/common.md#clear-and-simple-design Only supported local folders, a plain image name, camera and marker observations are transported.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reference describes an existing image and does not fit subject geometry or manufacture acquisition metadata.
 * @evidence contracts/common.md#meaningful-documentation The camera can be absent and landmarks empty; paths remain plain names inside the selected reference folder.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach A local photograph reference carries its optional acquisition camera and unit-image landmarks independently of a model document.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The reference describes an existing image and does not fit subject geometry or manufacture acquisition metadata.
 *
 * @author Samchon
 */
export interface IHumanViewerReference {
  /**
   * Folder and file name of the photograph, always a plain name inside the reference folder.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Restricts reference lookup to the supported local root or Body photograph folder.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Restricts reference lookup to the supported local root or Body photograph folder.
   */
  folder: "" | "body";

  /**
   * Plain image file name inside the selected local reference folder.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Names the original plain local photograph file without importing its path into numerical cache identity.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Names the original plain local photograph file without importing its path into numerical cache identity.
   */
  file: string;

  /**
   * The camera the photograph was taken from, or null when none was recorded.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Keeps actual optional acquisition-camera metadata, with null instead of an inferred photo viewpoint.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Keeps actual optional acquisition-camera metadata, with null instead of an inferred photo viewpoint.
   */
  camera: IHumanCaptureCamera | null;

  /**
   * Observed landmarks in unit image coordinates, empty when none were recorded.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Retains observed unit-image landmark coordinates independently of the generated anatomical model.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Retains observed unit-image landmark coordinates independently of the generated anatomical model.
   */
  landmarks: { x: number; y: number; group: string }[];
}
