import { IAutoMovieQuadraticHeap } from "./IAutoMovieQuadraticHeap";
import { createAutoMovieQuadraticHost } from "./quadraticKernelHost";

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
  // This reactor has no start function. Imports first run from an explicit
  // allocation/solve, after the exported memory has been assigned below.
  const instance = new WebAssembly.Instance(module, {
    wasi_snapshot_preview1: createAutoMovieQuadraticHost(() => api.memory),
  });
  const api = instance.exports as unknown as KernelExports;
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
      const address = api.automovie_alloc(length) >>> 0;
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
