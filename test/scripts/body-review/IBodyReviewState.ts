import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human/body/structures/IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieJointPose } from "@automovie/interface";

/**
 * A review state: the shape channels and pose a body review document is built from.
 *
 * @author Samchon
 */
export interface IBodyReviewState {
  /** Macro channel weights in `[-1, 1]` about the basis neutral. */
  shape: Record<string, number>;

  /** Sparse joint rows in clinical degrees. */
  pose: IAutoMovieJointPose[];

  /** Thorax-relative upper arm goals; an arm is raised through these, not through its joint row. */
  shoulders?: IAutoMovieHumanBodyShoulderPose[];
}
