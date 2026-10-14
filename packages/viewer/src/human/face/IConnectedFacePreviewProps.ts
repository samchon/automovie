import type { ConnectedFaceRequest } from "@automovie/human/face/runtime/ConnectedFaceRequest";
import type { ConnectedFaceResult } from "@automovie/human/face/runtime/ConnectedFaceResult";
import type { HumanResidentPort } from "../common/HumanResidentPort.js";
import type { createConnectedFaceRenderer } from "./createConnectedFaceRenderer.js";

/**
 * The preview's worker connection and texture renderer. Numerical evaluation
 * and texture preparation have separate owners under one request generation.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Typed face request/reply transport and a numerical frame renderer meet at the preview boundary. The worker owns numerical document evaluation and the renderer owns preparation; one generation withdraws stale publication authority.
 * @evidence contracts/common.md#clear-and-simple-design Two explicit collaborators separate numerical connection acquisition from GPU frame lifecycle without allocating browser services in this props type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture transport, source URL inferred from a face document or alternative geometry enters through these fields. Request grammar remains with the numerical face runtime.
 * @evidence contracts/common.md#meaningful-documentation Comments give lazy acquisition and renderer preparation roles; the acquired connection transfers termination to the preview while the renderer remains borrowed from its viewport owner.
 * @evidence contracts/performance.md#efficient-algorithms Reading two references is fixed work. Serialization, worker evaluation and material/geometry preparation remain the consuming operations' actual costs.
 * @evidence contracts/performance.md#reuse-equivalent-work One preview reuses its live connection and renderer across edits, while exports and changed documents keep independent request effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The preview retains these collaborators until its stage closes, terminates its acquired port and leaves GPU renderer closure to the stage. Concurrent numerical requests are not bounded by this type.
 */
export interface IConnectedFacePreviewProps {
  /**
   * Acquire a numerical connection whose termination transfers to the preview.
   *
   * @evidence contracts/common.md#principled-implementation The factory supplies the exact ConnectedFaceRequest/ConnectedFaceResult correlated port protocol; allocation occurs only when the resident coordinator needs a connection.
   * @evidence contracts/common.md#clear-and-simple-design A factory supports lazy acquisition and transport recovery without browser Worker construction in the frame renderer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Real consumer-selected transport/source supplies numerical work; no private source URL or fake candidate is substituted by this function type.
   * @evidence contracts/common.md#meaningful-documentation The comment states acquired connection transfer, resolving ambiguity between a borrowed host service and preview-owned termination.
   * @evidence contracts/performance.md#efficient-algorithms Host connection creation cost is paid on first use/reconnection rather than every successful edit; payload evaluation costs remain in the runtime.
   * @evidence contracts/performance.md#reuse-equivalent-work One live port serves independent correlated requests until failure/disposal; matching documents do not share effectful export completions.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The coordinator owns the returned port until failure or stage disposal. Its actual close contract governs uncertain termination; this field contains no request-count or worker-byte cap.
   */
  worker: () => HumanResidentPort<ConnectedFaceRequest, ConnectedFaceResult>;

  /** Prepare and release visible renderer resources for numerical previews. */
  renderer: ReturnType<typeof createConnectedFaceRenderer>;
}
