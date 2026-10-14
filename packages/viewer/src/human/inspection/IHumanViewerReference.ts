import type { IHumanCaptureCamera } from "@automovie/viewer/human/common/observation/IHumanCaptureCamera";

/**
 * The photograph a document is compared with, and how to place the camera like it.
 *
 * @evidence contracts/common.md#principled-implementation Describes an existing local photograph selected by manifest/stem plus optional admitted camera and recorded unit-image landmarks.
 * @evidence contracts/common.md#clear-and-simple-design Keeps reference metadata and photo presentation outside numerical document/basis/model cache authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Photographs supply visible comparison rather than hidden-tissue measurements; plain supported names must exist and landmarks are not fully validated anatomy.
 * @evidence contracts/common.md#meaningful-documentation Documents closed local folder choices, plain image basename and null camera/empty marker absence, with camera metres/degrees defined by its owner type.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The descriptor reads no image bytes; metadata selection scans directory/manifest facts and actual decode/layout belong to display/capture owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Reference metadata/bytes can change independently of numerical source, so current display metadata is reread rather than assumed equivalent by model key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page owns decoded image/DOM lifetime; this descriptor borrows marker arrays and retains strings/camera facts without acquiring a worker or image stream.
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
