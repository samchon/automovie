/**
 * Typed views borrowed from one engine-owned TypeScript numerical workspace.
 * Addresses are bytes, Float64 indices are doubles and Int32 indices are words.
 * Getters refuse once the synchronous callback ends. A retained typed view is
 * still an ordinary JS reference, so callers copy results before returning. The
 * former native positional solve ABI is retired; mathematics is called directly
 * through solveQuadraticKernel and its TypeScript owners.
 */
export interface IAutoMovieQuadraticHeap {
  /** Float64 view of the currently borrowed aligned storage. */
  readonly floats: Float64Array;

  /** Int32 view over the same currently borrowed storage. */
  readonly integers: Int32Array;
}
