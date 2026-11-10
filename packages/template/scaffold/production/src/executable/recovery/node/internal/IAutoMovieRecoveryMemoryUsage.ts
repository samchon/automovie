/**
 * Host-reported byte populations, independent of Node's ambient type declarations.
 * Values describe a sampled process rather than a package-wide resource bound.
 *
 * @evidence contracts/development/design.md#principled-representation Byte counters retain the existing host memory observation without exposing a runtime or ambient Node dependency through public declarations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A structural host record gives publication metadata one type owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No memory sample is substituted for a peak, enforced cap or geometry qualification.
 * @evidence contracts/development/common.md#meaningful-documentation States sampled bytes and the distinct counter meanings.
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
