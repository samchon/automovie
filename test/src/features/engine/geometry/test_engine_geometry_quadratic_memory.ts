import { AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieQuadraticHeap } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `createAutoMovieQuadraticMemory().withWorkspace(bytes, callback)` lends a
 * fresh, aligned, zeroed workspace for the callback only.
 *
 * Scenarios:
 *
 * 1. Eight bytes lend address 0, zeroed, with float and integer views on one
 *    buffer; a value written (1.25) reads back exactly; the views refuse after
 *    the callback ("borrow has ended").
 * 2. Nine bytes round to 16; their last byte exists. Byte counts 0, -1 and 2^32
 *    are refused ("integer byte count") before entering the callback.
 * 3. 65 553 bytes reach integer index 16 384; borrowing the same owner again
 *    inside is refused ("already borrowed"), another owner lends
 *    independently.
 * 4. A callback's own error passes out unchanged; the next borrow is zeroed again
 *    even after writing through an old view.
 */
export function test_engine_geometry_quadratic_memory(): void {
  const owner = AutoMovieEngineMath.createQuadraticMemory();
  const other = AutoMovieEngineMath.createQuadraticMemory();
  let retained: IAutoMovieQuadraticHeap | undefined;
  let view: Float64Array | undefined;

  // 1.
  owner.withWorkspace(8, (heap: IAutoMovieQuadraticHeap, address: number): void => {
    TestValidator.equals("address", address, 0);
    TestValidator.equals("zeroed", heap.floats[0], 0);
    heap.floats[0] = 1.25;
    TestValidator.equals("exact", heap.floats[0], 1.25);
    TestValidator.predicate("one buffer", heap.floats.buffer === heap.integers.buffer);
    retained = heap;
    view = heap.floats;
  });
  TestValidator.predicate(
    "ended",
    throwsError((): unknown => retained!.floats, "borrow has ended"),
  );

  // 2.
  owner.withWorkspace(9, (heap: IAutoMovieQuadraticHeap): void => {
    TestValidator.equals("aligned", heap.floats.byteLength, 16);
    const bytes: Uint8Array = new Uint8Array(heap.floats.buffer);
    bytes[8] = 123;
    TestValidator.equals("last byte", bytes[8], 123);
  });
  let entered: boolean = false;
  for (const count of [0, -1, 0x100000000])
    TestValidator.predicate(
      `count ${count}`,
      throwsError(
        (): void =>
          owner.withWorkspace(count, (): void => {
            entered = true;
          }),
        "integer byte count",
      ),
    );
  TestValidator.equals("never entered", entered, false);

  // 3.
  owner.withWorkspace(65553, (heap: IAutoMovieQuadraticHeap): void => {
    TestValidator.predicate("extent", heap.floats.byteLength >= 65553);
    heap.integers[16384] = 12345;
    TestValidator.equals("far index", heap.integers[16384], 12345);
    TestValidator.predicate(
      "recursive",
      throwsError((): void => owner.withWorkspace(8, (): void => {}), "already borrowed"),
    );
    other.withWorkspace(8, (independent: IAutoMovieQuadraticHeap): void => {
      independent.floats[0] = 2.5;
      TestValidator.equals("other owner", independent.floats[0], 2.5);
    });
  });

  // 4.
  const failure: Error = new Error("workspace callback");
  let caught: unknown = null;
  try {
    owner.withWorkspace(8, (): never => {
      throw failure;
    });
  } catch (error: unknown) {
    caught = error;
  }
  TestValidator.predicate("error identity", caught === failure);
  view![0] = 999;
  owner.withWorkspace(8, (heap: IAutoMovieQuadraticHeap): void => {
    TestValidator.equals("fresh again", heap.floats[0], 0);
  });
}
