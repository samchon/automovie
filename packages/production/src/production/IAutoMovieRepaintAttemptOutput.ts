/**
 * Describes available bytes by canonical digest, positive byte count and optional receipt, including output from an unsuccessful attempt.
 *
 * @evidence contracts/common.md#principled-implementation Describes available bytes by canonical digest, positive byte count and optional receipt, including output from an unsuccessful attempt.
 * @evidence contracts/common.md#clear-and-simple-design This shared metadata shape keeps optional byte availability distinct from candidate acceptance; storage correspondence remains with project admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural shape introduces no runtime branch, provider substitution or fixture-specific behavior; runtime facts are admitted by its stated producer/consumer boundaries.
 * @evidence contracts/common.md#meaningful-documentation Only metadata escapes in durable records, while raw byte ownership stays with the provider/service publication seam.
 * @evidence contracts/performance.md#efficient-algorithms This structural type erases at runtime; the executor validates this shape; the type does not hash bytes or prove receipt residency.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased shape shares the same admitted facts across its stated consumers; it creates no result cache or runtime equivalence/invalidation shortcut.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only metadata escapes in durable records, while raw byte ownership stays with the provider/service publication seam.
 */
export interface IAutoMovieRepaintAttemptOutput {
  /** Records canonical SHA256 metadata; validating its spelling does not prove resident byte correspondence. */
  digest: string;

  /** Counts positive available bytes when metadata is present; the service/project validates retained byte correspondence. */
  bytes: number;

  /** Optionally addresses retained raw output; the executor validates trimmed nonblank text while project publication owns residency. */
  receipt?: string;
}
