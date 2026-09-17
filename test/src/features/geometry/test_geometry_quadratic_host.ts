/**
 * Pure in-memory checks of the numerical reactor's deterministic WASI contract.
 * These invoke the actual host imported by quadraticKernelMemory, without a
 * browser, process, clock mock or source-text inspection.
 */
import { createAutoMovieQuadraticHost } from "@automovie/engine/math/quadraticKernelHost";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Pins the runtime services without granting access to ambient host state.
 *
 * Scenarios:
 * 1. Realtime/monotonic queries share an isolated logical clock; unsupported
 *    clock IDs refuse without writing or advancing the supported clocks.
 * 2. Entropy writes deterministic zeroes only to its requested interval,
 *    including empty requests and storage after actual linear-memory growth.
 * 3. An empty environment writes zero counts; file close/write are unavailable.
 * 4. Native exit becomes a caller exception and leaves another host independent.
 */
export const test_geometry_quadratic_host = (): void => {
  const memory = new WebAssembly.Memory({ initial: 1 });
  const host = createAutoMovieQuadraticHost(() => memory);
  const view = () => new DataView(memory.buffer);
  TestValidator.equals("first logical clock", host.clock_time_get(0, 0n, 0), 0);
  TestValidator.equals("one nanosecond", view().getBigUint64(0, true), 1n);
  TestValidator.equals("unsupported clock", host.clock_time_get(2, 0n, 0), 28);
  TestValidator.equals(
    "refusal does not write",
    view().getBigUint64(0, true),
    1n,
  );
  TestValidator.equals("monotonic clock", host.clock_time_get(1, 0n, 0), 0);
  TestValidator.equals(
    "same logical sequence",
    view().getBigUint64(0, true),
    2n,
  );
  const bytes = new Uint8Array(memory.buffer, 16, 4);
  bytes.fill(7);
  TestValidator.equals("entropy request", host.random_get(17, 2), 0);
  TestValidator.equals("bounded zero fill", Array.from(bytes), [7, 0, 0, 7]);
  TestValidator.equals("empty entropy request", host.random_get(16, 0), 0);
  TestValidator.equals("empty leaves bytes", Array.from(bytes), [7, 0, 0, 7]);
  memory.grow(1);
  view().setUint32(65536, 123, true);
  host.random_get(65536, 4);
  TestValidator.equals(
    "fresh memory after growth",
    view().getUint32(65536, true),
    0,
  );
  view().setUint32(24, 123, true);
  view().setUint32(28, 456, true);
  TestValidator.equals("environment sizes", host.environ_sizes_get(24, 28), 0);
  TestValidator.equals("no environment entries", view().getUint32(24, true), 0);
  TestValidator.equals("no environment bytes", view().getUint32(28, true), 0);
  TestValidator.equals("empty environment read", host.environ_get(), 0);
  TestValidator.equals("no file close", host.fd_close(), 8);
  TestValidator.equals("no file write", host.fd_write(), 8);
  TestValidator.predicate(
    "exit propagates as exception",
    throwsError(() => host.proc_exit(17), "code 17"),
  );
  const other = createAutoMovieQuadraticHost(() => memory);
  other.clock_time_get(1, 0n, 0);
  TestValidator.equals(
    "independent host clock",
    view().getBigUint64(0, true),
    1n,
  );
};
