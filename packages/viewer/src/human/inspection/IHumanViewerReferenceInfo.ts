import type { IHumanCaptureCamera } from "@automovie/viewer/human/common/observation/IHumanCaptureCamera";
import type { IHumanViewerLandmark } from "./IHumanViewerLandmark.js";

/**
 * The `/reference-info` answer for one document.
 *
 * @author Samchon
 */
export interface IHumanViewerReferenceInfo {
  /** Whether a local photograph exists for the document. */
  available: boolean;

  /** The photograph's camera, or null when none was recorded. */
  camera: IHumanCaptureCamera | null;

  /** Observed landmarks, empty when none were recorded. */
  landmarks: IHumanViewerLandmark[];
}
