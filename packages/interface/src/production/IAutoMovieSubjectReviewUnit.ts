import { AutoMovieSubjectReviewDescription } from "./AutoMovieSubjectReviewDescription";
import { IAutoMovieSubjectReviewTarget } from "./IAutoMovieSubjectReviewTarget";

/**
 * Resolved review unit for one compiled subject.
 *
 * @evidence contracts/common.md#principled-implementation resolveAutoMovieSubjectReviewUnit obtains the shared structural description or exact formation projection from current compiled data and adds artifact-qualified target and fixed inspection authority.
 * @evidence contracts/common.md#clear-and-simple-design Reuses compiled descriptions instead of constructing a second subject inventory, with formation review retaining its compact crowd record separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A unit is structurally ineligible as delivery evidence and cannot borrow the work's camera as viewpoint authority; unknown compiled subjects fail rather than producing an empty review unit.
 * @evidence contracts/common.md#meaningful-documentation Defines review protocol, exact target, description and revision, fixed viewpoint owner and delivery ineligibility.
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
