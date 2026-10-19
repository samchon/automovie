/**
 * Host-reported byte populations, independent of Node's ambient type declarations.
 * Values describe a sampled process rather than a package-wide resource bound.
 *
 * @evidence contracts/common.md#principled-implementation Byte counters retain the existing host memory observation without exposing a runtime or ambient Node dependency through public declarations.
 * @evidence contracts/common.md#clear-and-simple-design A structural host record gives publication metadata one type owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No memory sample is substituted for a peak, enforced cap or geometry qualification.
 * @evidence contracts/common.md#meaningful-documentation States sampled bytes and the distinct counter meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no sampling or traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sampling remains the caller's effect; this type defines no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record owns scalar values and no process handle.
 */
export interface IAutoMovieRecoveryMemoryUsage {
  /** Resident bytes sampled by the host. */
  rss: number;

  /** Allocated managed-heap bytes. */
  heapTotal: number;

  /** Used managed-heap bytes. */
  heapUsed: number;

  /** Host-reported external allocations, bytes. */
  external: number;

  /** Array-buffer bytes included by the host's accounting. */
  arrayBuffers: number;
}
