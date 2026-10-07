import type { IFaceLikenessCamera } from "../face-review/faceLikenessFraming";
import type { IHumanViewerLandmark } from "./IHumanViewerLandmark";

/**
 * The `/reference-info` answer for one document.
 *
 * @evidence contracts/common.md#meaningful-documentation Names whether a photograph exists and how to place the camera like it.
 * @author Samchon
 */
export interface IHumanViewerReferenceInfo {
  /** Whether a local photograph exists for the document. */
  available: boolean;

  /** The photograph's camera, or null when none was recorded. */
  camera: IFaceLikenessCamera | null;

  /** Observed landmarks, empty when none were recorded. */
  landmarks: IHumanViewerLandmark[];
}
