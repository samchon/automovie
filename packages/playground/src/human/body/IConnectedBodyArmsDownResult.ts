import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";

/**
 * The worker's reply to an arms-down request: the solved joint rows and
 * shoulder goals the editor writes into the draft.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Returns the solved arms-down pose for the editor to apply.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Correlates the solved pose with the worker request.
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
