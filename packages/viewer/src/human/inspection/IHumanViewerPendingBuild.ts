import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { ConnectedFaceResult } from "@automovie/human/face/runtime/ConnectedFaceResult";

/**
 * One numerical build the page asked its worker for and still awaits.
 *
 * @author Samchon
 */
export interface IHumanViewerPendingBuild {
  /** Settles the request with the worker's model. */
  resolve: (value: ConnectedFaceResult | ConnectedBodyResult) => void;

  /** Settles the request with the worker's refusal. */
  reject: (error: Error) => void;
}
