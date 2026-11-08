/**
 * Bind a final local reconstruction and its independently useful partial publications.
 * Completion flags retain the difference between an ended attempt and supported coverage.
 *
 * @evidence contracts/development/design.md#principled-representation Each byte receipt names an actual immutable publication; generated counts and completion qualifications come from the producing recovery invocation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One return record distinguishes the final model, early base, optional standalone prefixes and joint spool journal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A base or frontier receipt does not imply finished open generation, source fidelity, embedding or a resumed iterator.
 * @evidence contracts/development/common.md#meaningful-documentation Fields state logical JSON identity, generated populations and partial publication roles.
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
