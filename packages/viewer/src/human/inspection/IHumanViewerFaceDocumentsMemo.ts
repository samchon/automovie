import type { IHumanViewerFaceDocuments } from "./IHumanViewerFaceDocuments.js";

/**
 * The face documents of the last reading and what they were read from.
 *
 * @evidence contracts/common.md#meaningful-documentation Names both members.
 *
 * @evidence contracts/common.md#principled-implementation A nullable signature binds reused face documents to subject input, basis bytes and Face source identity.
 * @evidence contracts/common.md#clear-and-simple-design One signature and one value represent the memo's uninitialized and populated states.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unchanged subject name alone is insufficient for reuse when its basis or builder digest changed.
 *
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity A nullable signature binds reused face documents to subject input, basis bytes and Face source identity.
 * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation An unchanged subject name alone is insufficient for reuse when its basis or builder digest changed.
 *
 * @author Samchon
 */
export interface IHumanViewerFaceDocumentsMemo {
  /**
   * The subject list's stamp, the face basis digest and the face source digest; null before the first reading.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Binds reuse to subject input, basis digest and Face source, with null before any reading.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Binds reuse to subject input, basis digest and Face source, with null before any reading.
   */
  signature: string | null;

  /**
   * The documents read under that signature.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Keeps only documents produced under the matching signature, remaining null while the memo is uninitialized.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Keeps only documents produced under the matching signature, remaining null while the memo is uninitialized.
   */
  value: IHumanViewerFaceDocuments | null;
}
