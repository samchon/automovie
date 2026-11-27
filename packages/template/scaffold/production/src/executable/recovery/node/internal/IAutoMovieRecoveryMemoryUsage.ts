/*
 * Host-reported byte populations, independent of Node's ambient type declarations.
 * Values describe a sampled process rather than a package-wide resource bound.
 */
export interface IAutoMovieRecoveryMemoryUsage {
  /*
   * Resident bytes sampled by the host.
   */
  rss: number;

  /*
   * Allocated managed-heap bytes.
   */
  heapTotal: number;

  /*
   * Used managed-heap bytes.
   */
  heapUsed: number;

  /*
   * Host-reported external allocations, bytes.
   */
  external: number;

  /*
   * Array-buffer bytes included by the host's accounting.
   */
  arrayBuffers: number;
}
