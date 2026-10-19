/**
 * Bind a final local reconstruction and its independently useful partial publications.
 * Completion flags retain the difference between an ended attempt and supported coverage.
 *
 * @evidence contracts/common.md#principled-implementation Each byte receipt names an actual immutable publication; generated counts and completion qualifications come from the producing recovery invocation.
 * @evidence contracts/common.md#clear-and-simple-design One return record distinguishes the final model, early base, optional standalone prefixes and joint spool journal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A base or frontier receipt does not imply finished open generation, source fidelity, embedding or a resumed iterator.
 * @evidence contracts/common.md#meaningful-documentation Fields state logical JSON identity, generated populations and partial publication roles.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A return type performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The producer owns every receipt and does not regenerate geometry for this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only scalar metadata and paths are retained, without mesh arrays or handles.
 * @author Samchon
 */
export interface RecoveryLocalResult {
  /** SHA-256 of the final UTF-8 model JSON, before any separate archive operation. */
  sha256: string;

  /** Logical byte count of that final JSON publication. */
  bytes: number;

  /** All emitted base and retained-open render vertices and triangles. */
  counts: { vertices: number; triangles: number };

  /** Processing and retained-domain qualifications, independently of source coverage. */
  completion: {
    attemptComplete: boolean;
    processingComplete: boolean;
    retainedDomainComplete: boolean;
    generatedTriangles: number;
  };

  /** Optional repeated standalone open-prefix publications; final-only disables these. */
  checkpoints: { path: string; sha256: string; bytes: number }[];

  /** Always-published analytic and retained-closed model with an empty open part. */
  baseCheckpoint: { path: string; sha256: string; bytes: number };

  /** Last closed seven-channel journal record, including its source and run context. */
  frontier: { path: string; sha256: string; bytes: number };
}
