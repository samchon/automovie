/**
 * Typed views borrowed from one engine-owned TypeScript numerical workspace.
 * Addresses are bytes, Float64 indices are doubles and Int32 indices are words.
 * Getters refuse once the synchronous callback ends. A retained typed view is
 * still an ordinary JS reference, so callers copy results before returning.
 * The former native positional solve ABI is retired; mathematics is called
 * directly through solveAutoMovieQuadraticKernel and its TypeScript owners.
 *
 * @evidence contracts/common.md#principled-implementation Aligned views address one ordinary ArrayBuffer during a synchronous borrow; the owning getters enforce their lifetime and result extraction copies retained numerical values.
 * @evidence contracts/common.md#clear-and-simple-design The two element views expose workspace storage without an allocator, runtime instance or numerical transport method.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No native export, WASM memory or hidden solver is exposed; retained ordinary views are documented rather than falsely claimed to be revoked.
 * @evidence contracts/common.md#meaningful-documentation States byte/element units, borrow/getter lifetime, retained-view limitation and retirement of the old solve ABI.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A borrowed access record with constant-time view getters; allocation belongs to the memory owner.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A borrow shares no problem state across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The memory owner clears its buffer reference at callback completion; each view remains caller-owned if deliberately retained, and host GC reclaims unreachable storage.
 */
export interface IAutoMovieQuadraticHeap {
  /** Float64 view of the currently borrowed aligned storage. */
  readonly floats: Float64Array;

  /** Int32 view over the same currently borrowed storage. */
  readonly integers: Int32Array;
}
