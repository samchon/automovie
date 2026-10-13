/**
 * Why a face measurement reader cannot read the current basis.
 *
 * @evidence contracts/common.md#principled-implementation A named reason records why the required registration, reference or instrument is unavailable.
 * @evidence contracts/common.md#clear-and-simple-design Readers and report assembly distinguish gaps from numeric values without substituting expected targets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A gap is not a zero measurement or authorization to invert an unsupported clinical quantity.
 * @evidence contracts/common.md#meaningful-documentation Reason text belongs to the actual instrument's missing premise or refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The failing reader produces the reason; this schema executes no search or fallback.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Report and target-availability consumers reuse the same reason rather than recomputing geometry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the reason record and no unavailable geometry resource is retained by this type.
 *
 * @author Samchon
 */
export interface IHumanFaceMeasurementGap {
  /** What the basis lacks, for example an unregistered landmark. */
  reason: string;
}
