import { IAutoMovieQuadraticHeap } from "./IAutoMovieQuadraticHeap";
import { createAutoMovieQuadraticHost } from "./createAutoMovieQuadraticHost";
import data from "./quadraticKernelBytes.json";

/** The fixed exports of the embedded, unshared wasm32 numerical reactor. */
type KernelExports = {
  /** Current linear-memory buffer; allocation can grow and replace it. */
  memory: { readonly buffer: ArrayBuffer };

  /** Allocate a workspace in bytes, returning zero on allocation failure. */
  automovie_alloc(bytes: number): number;

  /** Release one workspace returned by automovie_alloc. */
  automovie_free(address: number): void;

  /** Invoke the positional numeric bridge documented by the borrowed heap. */
  automovie_quadratic_solve(...arguments_: number[]): number;
};

/**
 * The standard synchronous WebAssembly constructor subset used by this reactor.
 * Keep the projection local: Node provides these runtime constructors without
 * supplying the DOM library's ambient WebAssembly namespace to TypeScript.
 */
type KernelRuntime = {
  /** Compile fixed bytes into an opaque module consumed only by Instance. */
  Module: new (bytes: Uint8Array<ArrayBuffer>) => object;

  /** Instantiate that module with its closed WASI imports and opaque exports. */
  Instance: new (
    module: object,
    imports: {
      wasi_snapshot_preview1: ReturnType<typeof createAutoMovieQuadraticHost>;
    },
  ) => { readonly exports: object };
};

/**
 * Create one independent numerical memory owner. The program adapter retains
 * an instance, while a worker has its own module context. Input byte counts are
 * positive wasm32 integers. Allocation failure refuses the operation; callback
 * failure still frees its workspace before the next call. A callback must copy
 * any result it retains and must not recursively borrow this owner's workspace.
 *
 * @evidence contracts/common.md#principled-implementation A reactor allocates a wasm32 workspace, lends current-buffer views synchronously, and frees in finally on callback completion or failure; callers copy retained results and avoid recursive borrowing. A module-local structural projection calls the standard WebAssembly constructors present in supported Node and browser hosts without requiring DOM ambient declarations; fixed embedded bytes establish the export ABI.
 * @evidence contracts/common.md#clear-and-simple-design withWorkspace hides allocator exports, the deterministic host owns imports, and the kernel adapter owns buffer layout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid byte counts and allocation failure refuse before callback execution; fresh getters prevent stale views after memory growth.
 * @evidence contracts/common.md#meaningful-documentation States independent instance ownership, wasm32 byte bounds, failure cleanup, borrow lifetime and copy/nonrecursive obligations; the local constructor contract explains Node/browser typing and the fixed unshared export ABI.
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

  // Both supported hosts provide this standard runtime; the structural view
  // introduces no ambient browser types or replacement implementation.
  const runtime: KernelRuntime = (
    globalThis as typeof globalThis & { WebAssembly: KernelRuntime }
  ).WebAssembly;
  const module: object = new runtime.Module(bytes);

  // This reactor has no start function. Imports first run from an explicit
  // allocation/solve, after the exported memory has been assigned below.
  const instance: { readonly exports: object } = new runtime.Instance(module, {
    wasi_snapshot_preview1: createAutoMovieQuadraticHost(
      (): KernelExports["memory"] => api.memory,
    ),
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
