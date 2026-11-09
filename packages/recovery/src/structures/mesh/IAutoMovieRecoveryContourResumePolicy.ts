/** Actual original fitting policy, bound by the caller to saved artifact bytes.
 * The observer compares this identity with the saved section commitment; it
 * cannot infer the policy or verify a hash without the original artifact.
 *
 * @evidence contracts/development/design.md#principled-representation The original physical tolerance, corner threshold and material orientation determine the same fitting problem; only its span budget is replaced by an exact raw-edge bound.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One identity-keyed record separates immutable original policy from the independently computed new budget.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller must attest actual original values rather than introduce a relaxed tolerance or fabricated orientation. Identity comparison is not cryptographic verification.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, admissible ranges and caller artifact-binding responsibility.
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
