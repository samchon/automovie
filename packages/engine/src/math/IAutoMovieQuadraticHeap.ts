/**
 * Access to the quadratic kernel's WebAssembly linear memory during one
 * synchronous `withWorkspace` call of `createAutoMovieQuadraticMemory`.
 *
 * `floats` and `integers` are getters that build a new view of the current
 * buffer on every read, because a solve may grow the memory and detach older
 * views; read them again after `solve`. The heap is borrowed: the workspace is
 * freed when the callback returns, so a caller copies any value it keeps and
 * must not use the heap afterwards.
 *
 * @evidence contracts/common.md#principled-implementation Growing WebAssembly memory replaces its `ArrayBuffer` and detaches existing typed views, so fresh views per access are the only safe reading of a buffer the native solve may grow; the borrow ends with the callback because the owner frees the workspace in `finally`.
 * @evidence contracts/common.md#clear-and-simple-design The three operations the kernel transport needs, two element views and the bridge call, so `solveAutoMovieQuadraticKernel` lays out buffers without seeing the module's exports or allocator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exposes the module's own memory and export unchanged, without wrapping or replacing the native function, and no caller is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States that the views are rebuilt per read and why to read them again after a solve, the borrow lifetime, and the caller's duty to copy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An access record with no algorithm; layout and copying are answered on `solveAutoMovieQuadraticKernel`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A per-call borrow that coordinates no work across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing itself: each view is a short-lived object over memory the module owns, the workspace bytes are released by `withWorkspace` when the callback ends, and the module instance lives as long as its memory owner.
 */
export interface IAutoMovieQuadraticHeap {
  /** New float64 view of the whole current memory, indexed in doubles. */
  readonly floats: Float64Array;

  /** New int32 view of the whole current memory, indexed in 32-bit integers. */
  readonly integers: Int32Array;

  /**
   * Run the native bridge once with its fixed positional arguments: variable,
   * row and nonzero counts followed by byte addresses of the problem, initial,
   * primal, dual and information buffers, in the order
   * `solveAutoMovieQuadraticKernel` passes them.
   *
   * Returns 0 when the bridge ran, after which the information buffer holds six
   * doubles: status, iterations, primal residual, dual residual, objective and
   * dual objective. A nonzero return is an API error code and the buffers hold
   * no result. Each call constructs and drops its own native solver.
   *
   * @evidence contracts/common.md#principled-implementation Calls the kernel export directly with numeric arguments, the only types a WebAssembly function accepts, and separates the bridge's API error return from the solver's status, which lives in the information buffer.
   * @evidence contracts/common.md#clear-and-simple-design A single entry point to the native bridge; argument layout belongs to `solveAutoMovieQuadraticKernel`, which is its only caller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The export is passed through unchanged, with no retry or fallback around a nonzero return.
   * @evidence contracts/common.md#meaningful-documentation States the argument order and units, the return code meaning, the six information values and their order, and that no solver state survives the call.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The interior-point solve is native code outside this repository; this declaration only types the call.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call is a fresh cold solve by contract; nothing is shared between calls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The native solver is created and dropped inside the call; the memory it grows stays with the module instance, and the caller's workspace is freed by `withWorkspace`.
   */
  solve(...arguments_: number[]): number;
}
