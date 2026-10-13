/**
 * Solve a measured body channel for a metre target on the paired generation's evaluable body view. This request supplies authored weights only, not a complete person or authored anatomical targets; its returned reading describes the solved shape before any later document admission reapplies anatomy.
 *
 * @evidence contracts/common.md#principled-implementation A protocol discriminator, correlation id, shape map, channel id and metre target supply the existing bounded one-channel inverse on evaluable body reach.
 * @evidence contracts/common.md#clear-and-simple-design The message carries only shape-level solve inputs while the panel owns complete body/person document composition and numerical admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shape-only achieved reading is not represented as an independently measured final person after anatomical target reapplication.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies paired body reach, metre units, omitted full-document anatomy and pre-admission reading provenance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This request schema implements no bracketing or geometry measurement algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Correlation identity binds one requested effect and declares no cached solve result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The request holds ordinary shape references and scalars; the transport owns serialization, pending request and worker lifetime.
 *
 * @author Samchon
 */
export interface IConnectedPersonBodySolveMessage {
  /** Correlates the reply. */
  id: number;

  /** The request kind. */
  kind: "solveMeasurement";

  /** Body shape to solve from. */
  shape: Record<string, number>;

  /** Measured body channel. */
  channel: string;

  /** Target length, metres. */
  targetMetres: number;
}
