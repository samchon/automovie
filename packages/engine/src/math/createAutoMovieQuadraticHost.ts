
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
 * @evidence contracts/common.md#principled-implementation Closed WASI imports provide diagnostic nanoseconds, zero entropy, empty environment and unavailable descriptors; disabled native time limits keep these deterministic host values from selecting numerical output.
 * @evidence contracts/common.md#clear-and-simple-design The memory owner injects its current-memory getter, separating reactor imports from sparse layout and numerical admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clock and errno constants describe WASI behavior for all problems; no host clock, filesystem, randomness or process termination is invoked.
 * @evidence contracts/common.md#meaningful-documentation Documents private reactor scope, current-memory access, deterministic time/entropy, empty environment and unavailable descriptors.
 * @evidence contracts/performance.md#efficient-algorithms Host calls are constant time except random_get, which fills its requested byte count; views always observe current grown memory.
 * @evidence contracts/performance.md#reuse-equivalent-work One getter and tick counter are shared within a reactor; independent owners receive separate counters and memory.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The import record retains its getter and one bigint counter for the reactor lifetime; individual views allocate no separate linear-memory bytes.
 */
export function createAutoMovieQuadraticHost(memory: () => WebAssembly.Memory): { clock_time_get(id: number, _precision: bigint, address: number): number; random_get(address: number, length: number): number; environ_sizes_get(count: number, bytes: number): number; environ_get(): number; fd_close(): number; fd_write(): number; proc_exit(code: number): never; } {
  let ticks: bigint = 0n;
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
      const view: DataView<ArrayBuffer> = new DataView(memory().buffer);
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
