import type { IAutoMovieRecoveryCameraCalibration } from "@automovie/interface/recovery";

/**
 * Identity and caller-supplied calibration of one observed image.
 *
 * @evidence contracts/common.md#principled-implementation Original source-byte identity, pixel derivation history and independently supplied calibration remain distinct assertions.
 * @evidence contracts/common.md#clear-and-simple-design The named record is shared by the camera producer and evidence consumers without retaining numerical scratch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These recorded quantities supply no expected pose, metric scale, completed surface or missing measurement.
 * @evidence contracts/common.md#meaningful-documentation Members state integer-centre dimensions, source hashing responsibility and supplied calibration ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased record performs no computation; producing operations document their work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration defines no cache or shared effect.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Plain values belong to the caller; the declaration acquires no handle or running task.
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
