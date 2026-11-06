import { IAutoMovieQuadraticHeap } from "./IAutoMovieQuadraticHeap";

/**
 * Create an independent synchronous TypeScript workspace owner. Byte requests
 * are positive integers at most 2^32-1, rounded up for aligned float64 storage.
 * Each borrow receives fresh zero-initialized storage at byte address zero;
 * no factor, iterate or previous value survives into the next borrow.
 *
 * Nested borrowing refuses. A callback exception propagates after releasing
 * ownership in finally. Heap getters refuse after release; a caller that retains
 * results copies their values. Already obtained typed views remain ordinary JS
 * references, so they are not a memory-safety sandbox and can delay host GC.
 *
 * @evidence contracts/common.md#principled-implementation A fresh aligned ArrayBuffer supplies Float64/Int32 views during one synchronous callback. Positive bounded integer requests admit before allocation; active-borrow guards and finally release the owner's references on every completion path.
 * @evidence contracts/common.md#clear-and-simple-design Owns the numerical iterate's borrowed storage only, while the kernel owns its dimension and the interior solver owns its vector layout and result extraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses ordinary TypeScript typed arrays without native/WebAssembly imports, ambient services or hidden reuse; invalid requests and recursive borrows refuse before invoking their body.
 * @evidence contracts/common.md#meaningful-documentation States request units/range, zero address and initialization, alignment, reentry refusal, exception behavior, getter lifetime and the limits of ordinary retained JS views.
 * @evidence contracts/performance.md#efficient-algorithms Each borrow allocates and initializes O(bytes) storage once, with constant-time getters and no encoded-kernel decoding or module compilation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A borrow intentionally owns fresh state, because no preceding problem may seed the cold solver; no high-water pool is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owner retains one active borrow at most and releases its own buffer references in finally; result copies or retained callback views are caller-owned and actual reclamation belongs to host GC.
 */
export function createAutoMovieQuadraticMemory(): {
  withWorkspace<T>(bytes: number, use: (heap: IAutoMovieQuadraticHeap, address: number) => T): T;
} {
  let active: boolean = false;
  return {
    withWorkspace<T>(length: number, use: (heap: IAutoMovieQuadraticHeap, address: number) => T): T {
      if (!Number.isInteger(length) || length <= 0 || length > 0xffffffff)
        throw new Error("Quadratic workspace needs a positive bounded integer byte count.");
      if (active) throw new Error("Quadratic workspace is already borrowed.");
      let buffer: ArrayBuffer | undefined = new ArrayBuffer(8 * Math.ceil(length / 8));
      active = true;
      const heap: IAutoMovieQuadraticHeap = {
        get floats(): Float64Array {
          if (buffer === undefined) throw new Error("Quadratic workspace borrow has ended.");
          return new Float64Array(buffer);
        },
        get integers(): Int32Array {
          if (buffer === undefined) throw new Error("Quadratic workspace borrow has ended.");
          return new Int32Array(buffer);
        },
      };
      try {
        return use(heap, 0);
      } finally {
        buffer = undefined;
        active = false;
      }
    },
  };
}
