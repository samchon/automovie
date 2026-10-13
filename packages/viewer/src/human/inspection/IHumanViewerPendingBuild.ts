import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { ConnectedFaceResult } from "@automovie/human/face/runtime/ConnectedFaceResult";

/**
 * One numerical build the page asked its worker for and still awaits.
 *
 * @evidence contracts/common.md#meaningful-documentation Names how a worker reply settles its request.
 *
 * @evidence contracts/common.md#principled-implementation A pending request settles with the original Face or Body protocol result or its error.
 * @evidence contracts/common.md#clear-and-simple-design Resolve and reject contain the promise's two outcomes without owning the producer's numerical state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed build rejects the same waiting request instead of inventing an alternate model.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority A pending request settles with the original Face or Body protocol result or its error.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant A failed build rejects the same waiting request instead of inventing an alternate model.
 *
 * @author Samchon
 */
export interface IHumanViewerPendingBuild {
  /**
   * Settles the request with the worker's model.
   *
   * @evidence contracts/common.md#principled-implementation The waiting build settles with the original Face or Body numerical result.
   * @evidence contracts/common.md#clear-and-simple-design The promise callback does not own or recompute the model.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A result from another request or a manufactured preview cannot replace the producer's value.
   * @evidence contracts/common.md#meaningful-documentation The value is the producing product protocol result consumed by its awaiting build.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority The waiting build settles with the original Face or Body numerical result.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant The value is the producing product protocol result consumed by its awaiting build.
   */
  resolve: (value: ConnectedFaceResult | ConnectedBodyResult) => void;

  /**
   * Settles the request with the worker's refusal.
   *
   * @evidence contracts/common.md#principled-implementation The waiting numerical request rejects with the worker's original failure.
   * @evidence contracts/common.md#clear-and-simple-design Failure settlement remains one promise outcome separate from model completion.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback supplies no cached or fabricated model to hide a failed build.
   * @evidence contracts/common.md#meaningful-documentation The Error is propagated to the caller that awaited this build.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority The waiting numerical request rejects with the worker's original failure.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant The Error is propagated to the caller that awaited this build.
   */
  reject: (error: Error) => void;
}
