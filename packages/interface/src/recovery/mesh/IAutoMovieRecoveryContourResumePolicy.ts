/**
 * Actual original fitting policy, bound by the caller to saved artifact bytes. The observer compares this identity with the saved section commitment; it cannot infer the policy or verify a hash without the original artifact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Caller-verified byte identity of the artifact that used these actual values. Original positive finite polyline fitting tolerance, millimetres.
 * @evidence contracts/development/design.md#principled-representation Caller-verified byte identity of the artifact that used these actual values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface validateRecoveryContourResume, resumeAutoMovieRecoveryContours share IAutoMovieRecoveryContourResumePolicy's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Caller-verified byte identity of the artifact that used these actual values.
 */

export interface IAutoMovieRecoveryContourResumePolicy {
 
 /** Caller-verified byte identity of the artifact that used these actual values. */
  observationIdentity: string;

 
 /** Original positive finite polyline fitting tolerance, millimetres. */
  toleranceMm: number;

 
 /** Original corner threshold in degrees, strictly between zero and 180. */
  cornerDegrees: number;

 
 /** Original registered material-side orientation sign. */
  sourceOrientationSign: 1 | -1;

 
 /** Actual original positive safe-integer span budget, recorded without reusing its exhausted limit. */
  originalMaxSpans: number;
}
