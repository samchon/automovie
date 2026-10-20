/**
 * Caller-supplied corrected pinhole intrinsics in one integer-centre pixel chart.
 *
 * @evidence contracts/common.md#principled-implementation The upper-triangular K chart retains unequal focal scales, skew and principal offsets; physical calibration and lens correction remain assertions.
 * @evidence contracts/common.md#clear-and-simple-design One named chart is shared by resident images, fixed-file manifests and returned source evidence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It supplies no estimated pose, distortion solver, uncertainty covariance or inferred focal length.
 * @evidence contracts/common.md#meaningful-documentation Members state pixel units, matrix convention, positive focal values and nullable supplied uncertainty.
 */
export interface IAutoMovieRecoveryCameraCalibration {
  /** Perspective pinhole model; distortion parameters are not estimated. */
  type: "pinhole";

  /** Intrinsics are given independently of the estimated relative pose. */
  calibration: "supplied-intrinsics";

  /** Caller assertion that radial/tangential distortion has already been corrected. */
  distortion: "caller-corrected";

  /** Positive [fx,fy] in pixels, permitting unequal pixel-axis scales. */
  focalPx: [number, number];

  /** Finite K(0,1) skew in pixels; K(1,0)=K(2,0)=K(2,1)=0 and K(2,2)=1. */
  skewPx: number;

  /** Finite [cx,cy] in the same integer-pixel-centre chart. */
  principalPointPx: [number, number];

  /** Supplied calibration uncertainty in pixels, or null when unknown; not estimated covariance. */
  uncertaintyPx: number | null;
}
