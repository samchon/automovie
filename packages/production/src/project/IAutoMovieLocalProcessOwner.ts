



/**
 * Stable host, PID and generation identity of one local Node process.
 *
 * @evidence contracts/common.md#principled-implementation Host and PID identify a process-table slot while the UUID generation separates occupants that reuse that slot.
 * @evidence contracts/common.md#clear-and-simple-design Commit-lock descriptors and the owner observer share this identity; persistence admission remains in isAutoMovieLocalProcessOwner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A bare PID is never a process-generation proof and age is not part of this identity.
 * @evidence contracts/common.md#meaningful-documentation States hostname, positive safe PID and opaque generation fields.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type executes no process-table lookup or identity comparison.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current-owner function owns generation stability rather than this data declaration.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Descriptors are scalar data owned by their enclosing lock or observation; the type acquires no handle.
 */
export interface IAutoMovieLocalProcessOwner {
  /** Host whose process table assigned {@link pid}. */
  host: string;
  /** Positive safe-integer process identifier on {@link host}. */
  pid: number;
  /** Opaque UUID identifying this process generation. */
  generation: string;
}
