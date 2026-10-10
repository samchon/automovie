import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IHumanBodyCouplingContribution } from "./IHumanBodyCouplingContribution";

/**
 * Copied coupled source-pose rows and their ordered scalar increments; the pose resolver separately owns final frame admission.
 *
 * @author Samchon
 */
export interface IHumanBodyCouplingResult {
  /** Existing copied and coupled source joint rows. */
  joints: IAutoMovieJointPose[];

  /** Existing ordered source increments, with no clinical-frame reconstruction. */
  contributions: IHumanBodyCouplingContribution[];
}
