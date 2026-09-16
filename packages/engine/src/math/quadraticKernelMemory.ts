/**
 * Synchronous ownership boundary for the pinned convex numerical kernel.
 * The quadratic-program adapter borrows one contiguous workspace per call and
 * copies results before this owner frees it. No solver state survives cleanup.
 * Generated JSON contains the standalone module bytes and source provenance;
 * the module imports only a memory-growth notification, with no external I/O.
 * Heap views are read through getters because growth detaches earlier buffers.
 * All addresses and byte counts belong to wasm32, independently of mesh units.
 */
import data from "./quadraticKernelBytes.json";

/**
 * Borrowed heap access for one synchronous kernel call. Views are refreshed on
 * every access, including after the solver grows its linear memory. The native
 * bridge reports an API error separately from its six solver information values.
 *
 * @author Samchon
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Supplies isolated numeric storage for jointly constrained geometric displacement.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Keeps intermediate constraint storage separate from caller-owned resident mesh buffers.
 */
export interface IAutoMovieQuadraticHeap {
  /** Fresh float64 view of the current linear memory, indexed in doubles. */
  readonly floats: Float64Array;
  /** Fresh int32 view of the current linear memory, indexed in integers. */
  readonly integers: Int32Array;
  /** Invoke the fixed native bridge ABI and return its API error code. */
  solve(...arguments_: number[]): number;
}

type KernelExports = {
  memory: WebAssembly.Memory;
  malloc(bytes: number): number;
  free(address: number): void;
  _initialize(): void;
  automovie_quadratic_solve(...arguments_: number[]): number;
};

/**
 * Create one independent numerical memory owner. The program adapter retains
 * an instance, while a worker has its own module context. Input byte counts are
 * positive wasm32 integers. Allocation failure refuses the operation; callback
 * failure still frees its workspace before the next call. A callback must copy
 * any result it retains and must not recursively borrow this owner's workspace.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Runs the constrained displacement kernel without a network, file, clock or random-state dependency.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Owns and releases temporary numerical buffers while leaving input geometry under caller ownership.
 */
export function createAutoMovieQuadraticMemory(): {
  withWorkspace<T>(
    bytes: number,
    use: (heap: IAutoMovieQuadraticHeap, address: number) => T,
  ): T;
} {
  const bytes = new Uint8Array(data.hex.length / 2);
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = Number.parseInt(data.hex.slice(2 * i, 2 * i + 2), 16);
  const module = new WebAssembly.Module(bytes);
  const instance = new WebAssembly.Instance(module, {
    env: {
      // No persistent heap view exists, so growth needs no view update here.
      emscripten_notify_memory_growth() {},
    },
  });
  const api = instance.exports as unknown as KernelExports;
  api._initialize();
  const heap: IAutoMovieQuadraticHeap = {
    get floats() {
      return new Float64Array(api.memory.buffer);
    },
    get integers() {
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
      const address = api.malloc(length) >>> 0;
      if (address === 0)
        throw new Error("Quadratic workspace allocation failed.");
      try {
        return use(heap, address);
      } finally {
        api.free(address);
      }
    },
  };
}
