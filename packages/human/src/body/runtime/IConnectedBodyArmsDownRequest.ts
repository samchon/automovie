/**
 * A worker request to solve the arms-down pose for a body document.
 *
 * @evidence contracts/common.md#principled-implementation The armsDown discriminator carries one serialized numerical document for the resident worker's actual-skin pose solve.
 * @evidence contracts/common.md#clear-and-simple-design The request supplies the existing document rather than per-vertex offsets or a preset elevation control.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Request typing cannot certify collision-free or clinical results; parsing, basis admission and sampled crossing checks remain runtime-owned.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish operation kind and serialized input whose arms are solved, without embedding source geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This request schema performs no candidate build or contact search.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The request type implements no repeated-body cache or solve supersession.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration itself acquires no worker, candidate geometry or active solve task.
 *
 * @author Samchon
 */
export interface IConnectedBodyArmsDownRequest {
  /** Request kind. */
  operation: "armsDown";

  /** Serialized document whose arms are solved. */
  document: string;
}
