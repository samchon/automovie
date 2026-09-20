/**
 * Closed WASI environment for the synchronous quadratic kernel. Rust's runtime
 * imports these functions even though the solver has no external I/O contract.
 * quadraticKernelMemory supplies a getter after instantiation; each call reads
 * current memory because native allocation can grow and detach its old buffer.
 *
 * Diagnostic time advances by one nanosecond per query. Native time limits are
 * disabled and timing is not an output. Entropy is deterministic zero data,
 * environment is empty, and every file descriptor is unavailable. This host
 * is private numerical infrastructure, never a general WASI or security API.
 */

/**
 * Create isolated runtime imports for one reactor. The memory getter must be
 * usable before invoking its exports. No host clock, randomness, environment,
 * console, filesystem or process exit can influence the numerical result.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Keeps shared constrained-displacement computation independent of ambient host state.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Supplies deterministic runtime services while leaving geometry and caller data outside the native module.
 */
export function createAutoMovieQuadraticHost(memory: () => WebAssembly.Memory) {
  let ticks = 0n;
  return {
    clock_time_get(id: number, _precision: bigint, address: number): number {
      // WASI realtime and monotonic clocks are supported; CPU clocks are not.
      if (id !== 0 && id !== 1) return 28;
      new DataView(memory().buffer).setBigUint64(address, ++ticks, true);
      return 0;
    },
    random_get(address: number, length: number): number {
      new Uint8Array(memory().buffer, address, length).fill(0);
      return 0;
    },
    environ_sizes_get(count: number, bytes: number): number {
      const view = new DataView(memory().buffer);
      view.setUint32(count, 0, true);
      view.setUint32(bytes, 0, true);
      return 0;
    },
    environ_get(): number {
      return 0;
    },
    fd_close(): number {
      return 8;
    },
    fd_write(): number {
      return 8;
    },
    proc_exit(code: number): never {
      throw new Error(`Quadratic kernel exited with code ${code}.`);
    },
  };
}
