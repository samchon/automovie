/**
 * Maximum requested rest-field changes at shared neck samples in metres. Face value compares current face rest to face neutral; body value subtracts the eye-anchor rest shift from actual body rest displacement. These are observed pre-pose field magnitudes, not bounds on every final posed adjacent-ring gap under the skinning/twist operator. Source geometry admission and later normal/contact/global surface validity remain separate owners.
 *
 * @evidence contracts/common.md#principled-implementation Actual shared source samples and neutral/rest fields supply separate face and non-anchor body displacement maxima from skin formation.
 * @evidence contracts/common.md#clear-and-simple-design Two scalar receipts describe requested fields while common-value publication, posing and final admission remain concrete evaluator operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rest-field magnitude is not promoted into posed clearance, global seam continuity, clinical head proportion or current visual acceptance.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre units, neutral subtraction, anchor-shift removal and exact pre-pose observation scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This receipt schema runs no shared-sample scan or maximum calculation; formHumanPersonSkin owns those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reporting existing formed field maxima is consumer use, not a measurement cache implemented by this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two scalar members acquire no source buffers or tasks; returned build/consumer values own the receipt lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoundaryReading {
  /** Largest face-field displacement of a shared boundary sample, metres. */
  faceFieldMetres: number;

  /** Largest body rest-field displacement after removing the eye-anchor rest shift, metres. */
  bodyFieldMetres: number;
}
