import type { IHumanCaptureCamera } from "@automovie/viewer/human/common/observation/IHumanCaptureCamera";
import type { IHumanViewerLandmark } from "./IHumanViewerLandmark.js";

/**
 * The `/reference-info` answer for one document.
 *
 * @evidence contracts/common.md#meaningful-documentation Names whether a photograph exists and how to place the camera like it.
 *
 * @evidence contracts/common.md#principled-implementation Reference availability is reported separately from optional acquisition camera and observed landmarks.
 * @evidence contracts/common.md#clear-and-simple-design One metadata response contains the exact photograph facts the display can use.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing camera or landmarks remain null or empty instead of inferred acquisition measurements.
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
