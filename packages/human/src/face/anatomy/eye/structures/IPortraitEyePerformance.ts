/**
 * Eye performance relative to the recorded aperture. Optical curvature and
 * radius remain identity values; gaze rotates the actual optical surfaces.
 *
 * @evidence contracts/common.md#principled-implementation Four scalars are what the lid and optical posers read: the current closure, the closure already in the observation (which the closure ratio divides by), and two gaze differences that rotate the rigid optical surfaces; identity curvature and radius are deliberately absent.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of four named numbers whose ranges are enforced by one guard, `assertPortraitEyePerformance`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation Each field states its unit, interval, sign and meaning, and the record states that it is relative to the recorded aperture.
 * @evidence contracts/modeling.md#parameter-channels Each field varies one trait of one eye: closure, observed closure, gaze yaw and gaze pitch. Closure zero is the open lid and gaze zero is the observed gaze, so a state is an offset from neutral, and positive yaw turns to +X and positive pitch upwards as documented. The pair of eyes is two records with no shared field, so asymmetry is authored data. `blink` is meaningful only relative to `observedBlink`, which is the one dependency, and it is stated on the field.
 * @evidence contracts/modeling.md#spatial-conventions Closure is a dimensionless fraction and gaze is in degrees relative to the observation, in the head frame whose +X is anatomical left, as each field states.
 * @evidence contracts/anatomy.md#parametric-authority Every field is a named physiological motion (eyelid closure or gaze rotation); none addresses a vertex or a curve.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record parameterizes a performance and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record owns no part and displays nothing; the performed lids and globe are observed under the eye component.
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
