/**
 * Eye performance relative to the recorded aperture. Optical curvature and
 * radius remain identity values; gaze rotates the actual optical surfaces.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Separates eyelid closure and gaze from the optical identity dimensions.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Carries observed closure and current performance without refitting the globe.
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
