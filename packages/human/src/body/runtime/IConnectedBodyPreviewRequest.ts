/**
 * Request a numerical preview of one serialized body document. In the body evaluator, measure requests crossing output and anatomy requests head fits and ground observations, computing contacts internally even when measure is false. Candidate inspection runtimes return their own report instead of these optional body readings.
 *
 * @evidence contracts/common.md#principled-implementation The preview discriminator and exact document identify one evaluation, while measurement flags select optional observations rather than changing document admission.
 * @evidence contracts/common.md#clear-and-simple-design The same request reaches the selected body or candidate runtime; operation-specific interpretation remains with that producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional observations do not disable model checks or certify anatomy; candidate pages retain their distinct numerical report.
 * @evidence contracts/common.md#meaningful-documentation The prose explains contact work needed by anatomy even without crossing output and distinguishes body from candidate runtime behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This preview request schema chooses no evaluation or contact algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Flags describe requested output rather than implementing build reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no worker or preview buffers.
 *
 * @author Samchon
 */
export interface IConnectedBodyPreviewRequest {
  /** Select numerical preview without explicit glTF encoding. */
  operation: "preview";

  /** Original document text, reparsed with the selected runtime's source context. */
  document: string;

  /** Request body-runtime crossing output; anatomy can require the same contact work internally. */
  measure: boolean;

  /** Request body-runtime head-fit and ground observations; omission behaves as false there. */
  anatomy?: boolean;
}
