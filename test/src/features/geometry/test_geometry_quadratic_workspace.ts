import { createAutoMovieQuadraticMemory } from "@automovie/engine/math/createAutoMovieQuadraticMemory";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieQuadraticHeap } from "../../../../packages/engine/src/math/IAutoMovieQuadraticHeap";
import { nclose } from "../internal/nclose";
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
 *
 * @evidence contracts/testing.md#behavioral-verification Borrows actual numerical reactor workspaces, asserting double alignment, odd final-byte access, named invalid-byte refusals, allocation refusal before its tracked callback executes, fresh float/int views after forced growth, exception propagation and subsequent successful use. It catches stale views or broken recovery while permitting the owner's retained high-water memory.
 * @evidence contracts/testing.md#independent-expectations The wasm32 byte contract excludes nonpositive, fractional, nonfinite and greater-than-32-bit requests; the original maximal request cannot be allocated. Binary-exact 1.25/2.5 and authored integer/byte sentinels supply independent reads, and a request larger than initial capacity must grow memory. Recovery observes usable allocation but does not directly measure every freed byte or prove allocator lifetime beyond these calls.
 * @evidence contracts/testing.md#distinguishing-cases Preserves eight/odd-nine-byte success, six invalid byte counts, allocation failure with unentered body, actual growth, both element views, callback failure and recovery after each refusal. Numerical solve status and deterministic WASI services have separate owners.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry is CPU/WebAssembly integration that creates its own pinned reactor instance and invokes its actual allocator. It installs no consumer, builds no native artifact and starts no external process, browser or GPU; it owns all existing cases without dynamic registration.
 */
export function test_geometry_quadratic_workspace(): void {
  const memory: ReturnType<typeof createAutoMovieQuadraticMemory> =
    createAutoMovieQuadraticMemory();
  const readValue: () => number = (): number =>
    memory.withWorkspace(
      8,
      (heap: IAutoMovieQuadraticHeap, address: number): number => {
        heap.floats[address / 8] = 1.25;
        return heap.floats[address / 8];
      },
    );
  TestValidator.predicate(
    "binary-exact workspace value",
    nclose(readValue(), 1.25, 0),
  );
  memory.withWorkspace(
    9,
    (heap: IAutoMovieQuadraticHeap, address: number): void => {
      TestValidator.equals(
        "odd byte count retains double alignment",
        address % 8,
        0,
      );
      const bytes: Uint8Array = new Uint8Array(heap.floats.buffer);
      bytes[address + 8] = 123;
      TestValidator.equals(
        "odd allocation retains last byte",
        bytes[address + 8],
        123,
      );
    },
  );
  for (const count of [0, -1, 1.25, NaN, Infinity, 0x100000000])
    TestValidator.predicate(
      "invalid byte domain",
      throwsError(
        (): number => memory.withWorkspace(count, (): number => 0),
        "wasm32 byte count",
      ),
    );
  let entered: boolean = false;
  TestValidator.predicate(
    "unallocatable native request",
    throwsError(
      (): void =>
        memory.withWorkspace(0xffffffff, (): void => {
          entered = true;
        }),
      "allocation failed",
    ),
  );
  TestValidator.equals("refused body is not called", entered, false);
  TestValidator.predicate(
    "allocation refusal leaves owner usable",
    nclose(readValue(), 1.25, 0),
  );
  const initialCapacity: number = memory.withWorkspace(
    8,
    (heap: IAutoMovieQuadraticHeap): number => heap.floats.byteLength,
  );
  const grownCapacity: number = memory.withWorkspace(
    initialCapacity + 16,
    (heap: IAutoMovieQuadraticHeap, address: number): number => {
      heap.floats[address / 8] = 2.5;
      heap.integers[address / 4 + 2] = 12345;
      TestValidator.predicate(
        "fresh float view after growth",
        nclose(heap.floats[address / 8], 2.5, 0),
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
      (): never =>
        memory.withWorkspace(8, (): never => {
          throw new Error("workspace callback");
        }),
      "workspace callback",
    ),
  );
  TestValidator.predicate(
    "callback failure leaves owner usable",
    nclose(readValue(), 1.25, 0),
  );
}
