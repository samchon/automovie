import type { IAutoMovieHumanBodyShoulderPose } from "../../index";
import type { IAutoMovieJointPose } from "@automovie/interface";

/**
 * The worker's reply to an arms-down request: the solved joint rows and
 * shoulder goals the editor writes into the draft.
 *
 * @author Samchon
 */
export interface IConnectedBodyArmsDownResult {
  /** Reply kind. */
  operation: "armsDown";

  /** Solved sparse joint rows, in degrees. */
  pose: IAutoMovieJointPose[];

  /** Solved shoulder goals. */
  shoulders: IAutoMovieHumanBodyShoulderPose[];
}
