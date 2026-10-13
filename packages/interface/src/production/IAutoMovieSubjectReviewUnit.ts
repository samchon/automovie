import { AutoMovieSubjectReviewDescription } from "./AutoMovieSubjectReviewDescription";
import { IAutoMovieSubjectReviewTarget } from "./IAutoMovieSubjectReviewTarget";

/**
 * Resolved review unit for one compiled subject.
 *
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
