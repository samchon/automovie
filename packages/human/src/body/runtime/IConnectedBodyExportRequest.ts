/**
 * A worker request to encode the committed body document as static GLB.
 * The runtime reparses the exact text before optional cached-build reuse; export does not imply that the latest draft is the committed document.
 *
 * @evidence contracts/common.md#principled-implementation An explicit export operation carries the document whose admitted construction is encoded, independently of a pending preview.
 * @evidence contracts/common.md#clear-and-simple-design The request identifies the operation and input text; model evaluation and glTF encoding stay with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching cached text never bypasses canonical document admission, and export is not triggered by a preview flag.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies static output, exact document identity and the difference between committed export and draft preview.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This export request interface does not execute encoding.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The schema defines no build cache or in-flight sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased request type acquires no encoder handle or transferable output.
 *
 * @author Samchon
 */
export interface IConnectedBodyExportRequest {
  /** Select explicit static glTF encoding. */
  operation: "export";

  /** Exact serialized document to admit and encode, independently of pending preview text. */
  document: string;
}
