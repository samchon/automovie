import type { IHumanCaptureCamera } from "@automovie/viewer/human/common/observation/IHumanCaptureCamera";
import type { IHumanViewerLandmark } from "./IHumanViewerLandmark.js";

/**
 * The `/reference-info` answer for one document.
 *
 * @evidence contracts/common.md#principled-implementation The reference-info transport separates photograph availability from nullable camera metadata and an always-present landmark list.
 * @evidence contracts/common.md#clear-and-simple-design Three fields contain exactly the metadata showHumanViewerReference needs; image bytes stay on the separate reference route.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The metadata is resolved from local references rather than keyed to hardcoded subjects or numerical construction results.
 * @evidence contracts/common.md#meaningful-documentation Each member explains its missing-data state: false availability, null camera and empty landmarks have distinct meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The HTTP metadata type performs no file lookup or landmark layout; serving and display own those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Availability metadata contains no caching mechanism and does not establish equivalence across changed photographs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This serializable answer owns neither streams nor decoded images; the server and display retain their respective resources.
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
