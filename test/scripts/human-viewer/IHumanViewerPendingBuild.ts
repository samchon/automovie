import type { ConnectedBodyResult } from "@automovie/playground/src/human/body/ConnectedBodyResult";
import type { ConnectedFaceResult } from "@automovie/playground/src/human/common/connectedRuntime";

/**
 * One numerical build the page asked its worker for and still awaits.
 *
 * @evidence contracts/common.md#meaningful-documentation Names how a worker reply settles its request.
 * @author Samchon
 */
export interface IHumanViewerPendingBuild {
  /** Settles the request with the worker's model. */
  resolve: (value: ConnectedFaceResult | ConnectedBodyResult) => void;

  /** Settles the request with the worker's refusal. */
  reject: (error: Error) => void;
}
