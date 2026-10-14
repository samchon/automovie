

/**
 * Report why a host cannot accompany its attempted draw with complete runtime metadata.
 *
 * @evidence contracts/common.md#principled-implementation A distinct runtimeUnidentified field distinguishes missing provenance from a drawable or unsupported subject outcome.
 * @evidence contracts/common.md#clear-and-simple-design The sweep records the terminal runtime-unidentified attempt separately from general capture failure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reason is supplied by an opaque adapter; no pixels or successful observation are inferred from this outcome.
 * @evidence contracts/common.md#meaningful-documentation The literal outcome becomes an exact diagnostic/history reason, with no declared image artifact.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Host observation and failure recording execute in adapter/sweep owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reason is forwarded rather than obtaining a second fabricated runtime observation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the supplied reason is retained in results/journal; this schema acquires no page or image buffer.
 *
 * @author Samchon
 */
export interface IAutoMovieSubjectInspectionRuntimeUnidentified {
  /** Why no complete runtime identity can accompany this attempted draw. */
  runtimeUnidentified: string;
}
