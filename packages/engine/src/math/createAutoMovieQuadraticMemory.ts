import { IAutoMovieQuadraticHeap } from "./IAutoMovieQuadraticHeap";
import { createAutoMovieQuadraticHost } from "./createAutoMovieQuadraticHost";
import data from "./quadraticKernelBytes.json";

type KernelExports = {
  memory: WebAssembly.Memory;
  automovie_alloc(bytes: number): number;
  automovie_free(address: number): void;
  automovie_quadratic_solve(...arguments_: number[]): number;
};

/**
 * Create one independent numerical memory owner. The program adapter retains
 * an instance, while a worker has its own module context. Input byte counts are
 * positive wasm32 integers. Allocation failure refuses the operation; callback
 * failure still frees its workspace before the next call. A callback must copy
 * any result it retains and must not recursively borrow this owner's workspace.
 *
 * @evidence contracts/common.md#principled-implementation A reactor allocates a wasm32 workspace, lends current-buffer views synchronously, and frees in finally on callback completion or failure; callers copy retained results and avoid recursive borrowing.
 * @evidence contracts/common.md#clear-and-simple-design withWorkspace hides allocator exports, the deterministic host owns imports, and the kernel adapter owns buffer layout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid byte counts and allocation failure refuse before callback execution; fresh getters prevent stale views after memory growth.
 * @evidence contracts/common.md#meaningful-documentation States independent instance ownership, wasm32 byte bounds, failure cleanup, borrow lifetime and copy/nonrecursive obligations.
 * @evidence contracts/performance.md#efficient-algorithms Hex decoding is linear in kernel bytes and module compilation occurs at creation; each borrow allocates once and obtains constant-time views.
 * @evidence contracts/performance.md#reuse-equivalent-work Sequential solves reuse one reactor and compilation, while workers retain independent module contexts and mutable memory.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owner retains linear-memory high-water pages until released; workspace allocations are freed on every callback outcome, but WebAssembly pages cannot shrink.
 */
export function createAutoMovieQuadraticMemory(): {
  withWorkspace<T>(
    bytes: number,
    use: (heap: IAutoMovieQuadraticHeap, address: number) => T,
  ): T;
} {
  const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(data.hex.length / 2);
  for (let i: number = 0; i < bytes.length; i++)
    bytes[i] = Number.parseInt(data.hex.slice(2 * i, 2 * i + 2), 16);
  const module: WebAssembly.Module = new WebAssembly.Module(bytes);
  // This reactor has no start function. Imports first run from an explicit
  // allocation/solve, after the exported memory has been assigned below.
  const instance: WebAssembly.Instance = new WebAssembly.Instance(module, {
    wasi_snapshot_preview1: createAutoMovieQuadraticHost((): WebAssembly.Memory => api.memory),
  });
  const api: KernelExports = instance.exports as unknown as KernelExports;
  const heap: IAutoMovieQuadraticHeap = {
    get floats(): Float64Array<ArrayBuffer> {
      return new Float64Array(api.memory.buffer);
    },
    get integers(): Int32Array<ArrayBuffer> {
      return new Int32Array(api.memory.buffer);
    },
    solve: api.automovie_quadratic_solve,
  };
  return {
    withWorkspace<T>(
      length: number,
      use: (heap: IAutoMovieQuadraticHeap, address: number) => T,
    ): T {
      if (!Number.isInteger(length) || length <= 0 || length > 0xffffffff)
        throw new Error(
          "Quadratic workspace needs a positive wasm32 byte count.",
        );
      const address: number = api.automovie_alloc(length) >>> 0;
      if (address === 0)
        throw new Error("Quadratic workspace allocation failed.");
      try {
        return use(heap, address);
      } finally {
        api.automovie_free(address);
      }
    },
  };
}
