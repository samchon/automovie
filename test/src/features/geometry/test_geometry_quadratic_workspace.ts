import { createAutoMovieQuadraticMemory } from "@automovie/engine/math/quadraticKernelMemory";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A synchronous numerical workspace retains fresh heap access across native
 * memory growth and recovers after a caller exception. This scenario creates
 * its own module instance, so no earlier solver call supplies the tested state.
 *
 * Scenarios:
 * 1. A small valid workspace stores a known binary-exact value. Zero, negative,
 *    fractional and out-of-wasm32 counts are refused beside that valid input.
 * 2. A request beyond the native addressable allocation refuses without calling
 *    its body, and a subsequent small request remains usable.
 * 3. A workspace larger than the initial heap forces actual memory growth; both
 *    floating and integer views address the newly allocated range correctly.
 * 4. A callback exception propagates through cleanup; the next caller can write
 *    and read its independently owned workspace normally.
 */
export const test_geometry_quadratic_workspace = (): void => {
  const memory = createAutoMovieQuadraticMemory();
  const readValue = (): number =>
    memory.withWorkspace(8, (heap, address) => {
      heap.floats[address / 8] = 1.25;
      return heap.floats[address / 8];
    });
  TestValidator.equals("binary-exact workspace value", readValue(), 1.25);
  memory.withWorkspace(9, (heap, address) => {
    TestValidator.equals(
      "odd byte count retains double alignment",
      address % 8,
      0,
    );
    const bytes = new Uint8Array(heap.floats.buffer);
    bytes[address + 8] = 123;
    TestValidator.equals(
      "odd allocation retains last byte",
      bytes[address + 8],
      123,
    );
  });
  for (const count of [0, -1, 1.25, NaN, Infinity, 0x100000000])
    TestValidator.predicate(
      "invalid byte domain",
      throwsError(
        () => memory.withWorkspace(count, () => 0),
        "wasm32 byte count",
      ),
    );
  let entered = false;
  TestValidator.predicate(
    "unallocatable native request",
    throwsError(
      () =>
        memory.withWorkspace(0xffffffff, () => {
          entered = true;
        }),
      "allocation failed",
    ),
  );
  TestValidator.equals("refused body is not called", entered, false);
  TestValidator.equals(
    "allocation refusal leaves owner usable",
    readValue(),
    1.25,
  );
  const initialCapacity = memory.withWorkspace(
    8,
    (heap) => heap.floats.byteLength,
  );
  const grownCapacity = memory.withWorkspace(
    initialCapacity + 16,
    (heap, address) => {
      heap.floats[address / 8] = 2.5;
      heap.integers[address / 4 + 2] = 12345;
      TestValidator.equals(
        "fresh float view after growth",
        heap.floats[address / 8],
        2.5,
      );
      TestValidator.equals(
        "fresh integer view after growth",
        heap.integers[address / 4 + 2],
        12345,
      );
      return heap.floats.byteLength;
    },
  );
  TestValidator.predicate(
    "native memory really grew",
    grownCapacity > initialCapacity,
  );
  TestValidator.predicate(
    "callback exception propagates",
    throwsError(
      () =>
        memory.withWorkspace(8, () => {
          throw new Error("workspace callback");
        }),
      "workspace callback",
    ),
  );
  TestValidator.equals(
    "callback failure leaves owner usable",
    readValue(),
    1.25,
  );
};
