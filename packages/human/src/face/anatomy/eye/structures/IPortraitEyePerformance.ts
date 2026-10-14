/**
 * Eye performance relative to the recorded aperture. Optical curvature and
 * radius remain identity values; gaze rotates the actual optical surfaces.
 *
 *
 * @evidence contracts/common.md#principled-implementation Current/observed closure and degree gaze differences preserve fixed optical identity while moving admitted surfaces.
 * @evidence contracts/common.md#clear-and-simple-design assertPortraitEyePerformance owns supported ranges and pose/contact consumers own geometry consequences.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The .95 observation ceiling and gaze bounds are engineering conditions rather than clinical population limits.
 * @evidence contracts/common.md#meaningful-documentation Fields state normalized closure, observed-height limitation and head-axis angle signs.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitEyePerformance is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitEyePerformance declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitEyePerformance acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IPortraitEyePerformance {
  /** Current closure in [0,1]; one brings the two margins to a common seam. */
  blink: number;

  /** Closure already in the observed aperture, in [0,0.95]; a fully hidden aperture cannot determine its neutral height. */
  observedBlink: number;

  /** Gaze yaw difference from the observation, in [-50,50] degrees; positive turns towards +X. */
  yaw: number;

  /** Gaze pitch difference from the observation, in [-40,40] degrees; positive turns upwards. */
  pitch: number;
}
