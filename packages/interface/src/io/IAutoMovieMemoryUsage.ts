/**
 * One host memory-accounting sample in bytes, without a process handle or
 * timer. These populations overlap: external and array-buffer accounting must
 * not be added to RSS as disjoint allocations. The host supplies finite
 * nonnegative observations under its own sampling semantics; no allocation
 * ceiling follows.
 */

export interface IAutoMovieMemoryUsage {
  /** Resident bytes sampled by the host. */
  rss: number;

  /** Allocated managed heap bytes. */
  heapTotal: number;

  /** Used managed heap bytes. */
  heapUsed: number;

  /** Host-reported external allocation bytes. */
  external: number;

  /** Array buffer bytes within host accounting. */
  arrayBuffers: number;
}
