import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";

/**
 * One request the person editor posts to its resident numerical worker: the existing body-preview protocol carrying a complete person document.
 *
 * The person runtime parses the document with its paired generation and returns correlated construction, admission or export results; the envelope itself does not enforce reply provenance or editor intent.
 *
 * @evidence contracts/common.md#principled-implementation The shared resident request envelope retains transport id and body-preview operation payload while the person runtime interprets its serialized document in paired context.
 * @evidence contracts/common.md#clear-and-simple-design Protocol reuse separates the numerical worker transport from runtime person parsing and panel transaction authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reusing the body protocol does not imply body-only evaluation, and correlation alone cannot admit a stale person result or certify geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies complete-person interpretation, paired generation, operation results and separate reply/intent authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The envelope interface implements no dispatch, construction or serialization algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request ids are not numerical document-cache keys or frame reuse identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The message acquires no native worker, pending-response queue or prepared GPU resident.
 *
 * @author Samchon
 */
export interface IConnectedPersonWorkerMessage {
  /** Correlates the reply. */
  id: number;

  /** The body-protocol request carrying a person document. */
  input: ConnectedBodyRequest;
}
