/**
 * One host memory-accounting sample in bytes, without a process handle or timer.
 * These populations overlap: external and array-buffer accounting must not be
 * added to RSS as disjoint allocations. The host supplies finite nonnegative
 * observations under its own sampling semantics; no allocation ceiling follows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines byte units, overlapping populations and host-owned sampling.
 * @evidence contracts/development/design.md#principled-representation Explicit resident, managed and external populations preserve the producer's accounting without importing its process API.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Memory observers consume a value snapshot; acquisition and process lifetime stay in the host.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Sampled populations are telemetry rather than enforced budgets or an exact peak between samples.
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
