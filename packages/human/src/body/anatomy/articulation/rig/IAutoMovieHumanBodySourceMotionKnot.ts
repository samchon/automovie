/**
 * One source-authored mapping from a driver coordinate to a joint coordinate.
 *
 * @evidence contracts/common.md#principled-implementation Input and output coordinates define one source mapping sample; the profile reader requires increasing inputs and uses the driver's and axis's respective units.
 * @evidence contracts/common.md#clear-and-simple-design A two-number knot keeps mapping data separate from the joint and driver identities that supply its units.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The profile represents source-authored conversion rather than copying expected output from a consumer or test fixture.
 * @evidence contracts/common.md#meaningful-documentation Property comments identify input ordering and both coordinate-unit authorities without claiming interpolation validates anatomy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A knot record is interpolation input and performs no segment search or numeric evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Individual mapping knots contain no cached interpolation result or request identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The pair of scalar coordinates requires no retained lookup table owner or release callback.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceMotionKnot {
  /** Input coordinate in the driver's declared unit, strictly increasing across a profile. */
  input: number;

  /** Output coordinate in the source joint axis's declared unit. */
  output: number;
}
