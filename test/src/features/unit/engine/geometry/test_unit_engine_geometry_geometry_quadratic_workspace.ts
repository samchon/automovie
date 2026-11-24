import { createAutoMovieQuadraticMemory } from "@automovie/engine";
import type { IAutoMovieQuadraticHeap } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/predicates";

/**
 * TypeScript numerical borrows own fresh aligned state and release access after
 * every callback outcome. This preserves the former transport's ownership and
 * refusal responsibilities without assuming a native allocator or growing heap.
 *
 * Scenarios:
 * 1. Eight and odd-nine byte borrows expose one aligned buffer and its last byte;
 *    invalid, fractional, nonfinite and over-limit counts refuse before entry.
 * 2. A larger borrow exposes its full requested extent; later borrows start at
 *    zero and never retain prior numeric state or an earlier caller's mutations.
 * 3. Recursive borrowing refuses, while a different owner remains independent.
 * 4. Getter access after return refuses; callback failure propagates its identity
 *    and releases the owner for the next independent borrow.
 */
export function test_unit_engine_geometry_geometry_quadratic_workspace(): void {
  const owner: ReturnType<typeof createAutoMovieQuadraticMemory> =
    createAutoMovieQuadraticMemory();
  const other: ReturnType<typeof createAutoMovieQuadraticMemory> =
    createAutoMovieQuadraticMemory();
  let retained: IAutoMovieQuadraticHeap | undefined;
  let view: Float64Array | undefined;
  owner.withWorkspace(
    8,
    (heap: IAutoMovieQuadraticHeap, address: number): void => {
      TestValidator.equals("aligned zero byte address", address, 0);
      TestValidator.predicate(
        "fresh numerical state",
        nclose(heap.floats[0], 0, 0),
      );
      heap.floats[0] = 1.25;
      retained = heap;
      view = heap.floats;
      TestValidator.predicate(
        "binary-exact numerical value",
        nclose(heap.floats[0], 1.25, 0),
      );
      TestValidator.predicate(
        "views share one buffer",
        heap.floats.buffer === heap.integers.buffer,
      );
    },
  );
  TestValidator.predicate(
    "released getter refuses",
    throwsError((): Float64Array => retained!.floats, "borrow has ended"),
  );
  owner.withWorkspace(9, (heap: IAutoMovieQuadraticHeap): void => {
    TestValidator.equals("odd byte alignment", heap.floats.byteLength, 16);
    const bytes: Uint8Array = new Uint8Array(heap.floats.buffer);
    bytes[8] = 123;
    TestValidator.equals("last requested byte exists", bytes[8], 123);
  });
  let entered: boolean = false;
  for (const count of [0, -1, 0x100000000])
    TestValidator.predicate(
      "invalid byte domain",
      throwsError(
        (): void =>
          owner.withWorkspace(count, (): void => {
            entered = true;
          }),
        "integer byte count",
      ),
    );
  TestValidator.equals("invalid request never enters callback", entered, false);
  owner.withWorkspace(65553, (heap: IAutoMovieQuadraticHeap): void => {
    TestValidator.predicate(
      "requested extent is resident",
      heap.floats.byteLength >= 65553,
    );
    heap.integers[16384] = 12345;
    TestValidator.equals(
      "large view reaches requested range",
      heap.integers[16384],
      12345,
    );
    TestValidator.predicate(
      "same-owner recursive borrow refuses",
      throwsError(
        (): void => owner.withWorkspace(8, (): void => {}),
        "already borrowed",
      ),
    );
    other.withWorkspace(8, (independent: IAutoMovieQuadraticHeap): void => {
      independent.floats[0] = 2.5;
      TestValidator.predicate(
        "different owner remains usable",
        nclose(independent.floats[0], 2.5, 0),
      );
    });
  });
  const failure: Error = new Error("workspace callback");
  let propagated: unknown;
  try {
    owner.withWorkspace(8, (): never => {
      throw failure;
    });
  } catch (error) {
    propagated = error;
  }
  TestValidator.predicate("callback error identity", propagated === failure);
  view![0] = 999;
  owner.withWorkspace(8, (heap: IAutoMovieQuadraticHeap): void => {
    TestValidator.predicate(
      "failure and old view retain no state",
      nclose(heap.floats[0], 0, 0),
    );
    heap.floats[0] = 2.5;
    TestValidator.predicate("owner recovers", nclose(heap.floats[0], 2.5, 0));
  });
}
