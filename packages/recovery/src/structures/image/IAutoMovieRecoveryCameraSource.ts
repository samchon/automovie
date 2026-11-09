import type { IAutoMovieRecoveryCameraCalibration } from "@automovie/interface";

/**
 * Identity and caller-supplied calibration of one observed image.
 *
 * @evidence contracts/development/design.md#principled-representation Original source-byte identity, pixel derivation history and independently supplied calibration remain distinct assertions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named record is shared by the camera producer and evidence consumers without retaining numerical scratch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These recorded quantities supply no expected pose, metric scale, completed surface or missing measurement.
 * @evidence contracts/development/common.md#meaningful-documentation Members state integer-centre dimensions, source hashing responsibility and supplied calibration ownership.
 */
export interface IAutoMovieRecoveryCameraSource {
  /** Unique acquisition identity in first/second order. */
  id: string;

  /** Caller-asserted fixed source-byte hash; Node hosts verify their acquired source inputs. */
  sourceSha256: string;

  /** Declared decoding, crop, orientation and correction history for the current chart. */
  pixelProvenance: string;

  /** Resident integer-centre dimensions in pixels. */
  width: number;

  /** Resident integer-centre height in pixels. */
  height: number;

  /** Supplied corrected pinhole intrinsics, including nullable asserted uncertainty. */
  camera: IAutoMovieRecoveryCameraCalibration;
}
