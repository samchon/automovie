import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IHumanBodyCouplingContribution } from "./IHumanBodyCouplingContribution";

/**
 * The existing pelvifemoral scalar coordination result; only flexion increments are emitted here.
 *
 * @author Samchon
 */
export interface IHumanBodyPelvifemoralResult {
  /** Copied source-pose rows with the declared sagittal coordination. */
  joints: IAutoMovieJointPose[];

  /** Existing ordered flexion increments, distinct from final frame readings. */
  contributions: (Omit<IHumanBodyCouplingContribution, "axis"> &
    Record<"axis", "flexion">)[];
}
