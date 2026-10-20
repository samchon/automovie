import type { IAutoMovieRecoveryCameraCalibration } from "./IAutoMovieRecoveryCameraCalibration";

/**
 * Borrowed fixed RGB8 pixels and their source/calibration identity.
 *
 * @evidence contracts/common.md#principled-implementation Exact RGB dimensions and an unchanged pixel chart define the resident observation; the caller keeps borrowed bytes stable until return.
 * @evidence contracts/common.md#clear-and-simple-design Each image combines acquisition identity, source history and its independently supplied chart.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No mask, hand correspondence, truth pose or rigid-scene proof is supplied by the view.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish source bytes from pixel derivations, integer-centre dimensions and borrowed buffer lifetime.
 */
export interface IAutoMovieRecoveryCameraView {
  /** Unique image/camera identity. */
  id: string;

  /** Caller-asserted lowercase SHA-256 of fixed source bytes; decoding/capture derivations belong to pixelProvenance. File hosts verify acquired inputs. */
  sourceSha256: string;

  /** Explicit decoding, orientation, crop and correction history of this exact chart. */
  pixelProvenance: string;

  /** Positive integer width of the calibrated resident chart. */
  width: number;

  /** Positive integer height of the calibrated resident chart. */
  height: number;

  /** Exactly 3*width*height row-major unsigned sRGB bytes; caller keeps these unchanged, including from other workers, until the synchronous operation returns. */
  rgb8: Uint8Array;

  /** Caller-supplied lens calibration in this exact pixel-centre chart. */
  camera: IAutoMovieRecoveryCameraCalibration;
}
