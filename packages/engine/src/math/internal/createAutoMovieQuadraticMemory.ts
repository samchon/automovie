import type {
  IAutoMovieCreateQuadraticMemory,
  IAutoMovieQuadraticHeap,
} from "@automovie/interface";

/**
 * Create an independent synchronous TypeScript workspace owner. Byte requests
 * are positive integers at most 2^32-1, rounded up for aligned float64 storage.
 * Each borrow receives fresh zero-initialized storage at byte address zero; no
 * factor, iterate or previous value survives into the next borrow.
 *
 * Nested borrowing refuses. A callback exception propagates after releasing
 * ownership in finally. Heap getters refuse after release; a caller that
 * retains results copies their values. Already obtained typed views remain
 * ordinary JS references, so they are not a memory-safety sandbox and can delay
 * host GC.
 */
export function createAutoMovieQuadraticMemory(): IAutoMovieCreateQuadraticMemory.IResult {
  let active: boolean = false;
  return {
    withWorkspace<T>(
      length: number,
      use: (heap: IAutoMovieQuadraticHeap, address: number) => T,
    ): T {
      if (length <= 0 || length > 0xffffffff)
        throw new Error(
          "Quadratic workspace needs a positive bounded integer byte count.",
        );
      if (active) throw new Error("Quadratic workspace is already borrowed.");
      let buffer: ArrayBuffer | undefined = new ArrayBuffer(
        8 * Math.ceil(length / 8),
      );
      active = true;
      const heap: IAutoMovieQuadraticHeap = {
        get floats(): Float64Array {
          if (buffer === undefined)
            throw new Error("Quadratic workspace borrow has ended.");
          return new Float64Array(buffer);
        },
        get integers(): Int32Array {
          if (buffer === undefined)
            throw new Error("Quadratic workspace borrow has ended.");
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
