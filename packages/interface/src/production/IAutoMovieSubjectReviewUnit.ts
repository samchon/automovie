import { AutoMovieSubjectReviewDescription } from "./AutoMovieSubjectReviewDescription";
import { IAutoMovieSubjectReviewTarget } from "./IAutoMovieSubjectReviewTarget";

/**
 * Resolved review unit for one compiled subject.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection Makes a subject rather than a film moment the unit being reviewed.
 * @evidence requirements/review/subject-inspection.md#review-subject-identity Carries the stable compiled description without collapsing prototype and placement identities.
 * @evidence requirements/review/subject-inspection.md#review-observable-judgeable-parity Types the independent observation unit exposed for every supported subject target.
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Records that viewpoint authority belongs to inspection and cannot produce delivery evidence.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-record Types the resolved subject record used by review.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-target-parity Gives a resolved subject target its own observation unit.
 * @author Samchon
 */
export interface IAutoMovieSubjectReviewUnit {
  /** Subject-review protocol version. */
  version: 1;

  /** Exact target used to locate the compiled subject. */
  target: IAutoMovieSubjectReviewTarget;

  /** Compiled description and revision that define the unit. */
  description: AutoMovieSubjectReviewDescription;

  /** Viewpoint authority, fixed to the inspection rather than the work. */
  viewpointOwner: "inspection";

  /** Subject observations are never eligible as delivery-frame evidence. */
  deliveryEvidenceEligible: false;
}
