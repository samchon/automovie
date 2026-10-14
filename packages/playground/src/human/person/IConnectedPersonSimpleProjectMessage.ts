/**
 * Project simple values from the exact current person using anatomy-resolved effective body shape and complete-person rest-skin stature/volume. Numerical projection retains the document's own head context and does not itself admit the document or certify clinical identity.
 *
 * @evidence contracts/common.md#principled-implementation The projectPersonSimple discriminant and complete serialized person bind projection to effective canonical anatomy and its own rest-skin readings.
 * @evidence contracts/common.md#clear-and-simple-design The transport schema carries numerical context while deterministic projection and editor admission stay with their separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Body-only or standard-head readings do not replace the supplied complete context, and simple coordinates do not establish clinical identity or accepted history.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies complete-person context, effective anatomy, rest-skin reading provenance and separate admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This message declaration selects no shape projection, anatomy resolution or rest-skin construction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request ids identify transport correlation rather than a numerical projection cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no evaluator or pending task; its transport and resident worker own those lifetimes.
 *
 * @author Samchon
 */
export interface IConnectedPersonSimpleProjectMessage {
  /** Transport request identity. */
  id: number;

  /** Projection operation. */
  kind: "projectPersonSimple";

  /** Current whole-person document text. */
  document: string;
}
