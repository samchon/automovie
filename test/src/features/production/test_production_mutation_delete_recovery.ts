import { TestValidator } from "@nestia/e2e";
import { recoverProductionAtomicDelete } from "../../../../packages/production/src/production/recoverProductionAtomicDelete";

/**
 * Recovery never turns a failed deletion into a write in another namespace.
 *
 * Scenarios:
 * 1. Only a retained quarantine and an unoccupied target permit restoration.
 * 2. Guards before observation and restoration prevent the restore; the final
 *    guard can refuse after the restore already happened.
 * 3. Recovery failures follow the original failure, while successful recovery
 *    still reports that original failure, including a thrown undefined value.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real atomic-delete recovery coordinator through its declared callbacks, observing restoration only for retained/unoccupied targets, all three guard boundaries and original/aggregate failure identity and order.
 * @evidence contracts/testing.md#independent-expectations Authored boolean residency/occupancy pairs, a chosen guard ordinal and distinct error objects determine outcomes independently of the helper. Callback observations do not establish physical namespace reservations or filesystem race safety.
 * @evidence contracts/testing.md#distinguishing-cases Covers all quarantine/occupancy pairs, guard refusal before observation/before restoration/after restoration, restoration failure and both aggregated and directly rethrown undefined primary failures; actual rename and quarantine lifetime remain with filesystem transaction tests.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit directly imports the canonical recovery owner and owns local flags/counters/callbacks only; it opens no filesystem, process, renderer, browser or GPU and replaces no foreign method or production consumer.
 */
export function test_production_mutation_delete_recovery(): void {
  const primary: Error = new Error("delete failure");
  const recovery: Error = new Error("recovery failure");
  for (const quarantined of [false, true])
    for (const occupied of [false, true]) {
      let restored: boolean = false;
      let caught: unknown;
      try {
        recoverProductionAtomicDelete({
          file: "owned-target",
          error: primary,
          guard: (): void => undefined,
          quarantined: (): boolean => quarantined,
          occupied: (): boolean => occupied,
          restore: (): void => {
            restored = true;
          },
        });
      } catch (error) {
        caught = error;
      }
      TestValidator.equals(
        "restore only a retained unoccupied target",
        restored,
        quarantined && !occupied,
      );
      TestValidator.predicate(
        "successful recovery preserves original failure",
        caught === primary,
      );
    }
  for (const stop of [1, 2, 3]) {
    let guards: number = 0;
    let restored: boolean = false;
    let caught: unknown;
    try {
      recoverProductionAtomicDelete({
        file: "owned-target",
        error: primary,
        guard: (): void => {
          if (++guards === stop) throw recovery;
        },
        quarantined: (): boolean => true,
        occupied: (): boolean => false,
        restore: (): void => {
          restored = true;
        },
      });
    } catch (error) {
      caught = error;
    }
    TestValidator.equals(
      `guard ${stop} fences restoration`,
      restored,
      stop === 3,
    );
    TestValidator.predicate(
      "guard failure retains both errors",
      caught instanceof AggregateError &&
        caught.errors[0] === primary &&
        caught.errors[1] === recovery,
    );
  }
  let caught: unknown;
  try {
    recoverProductionAtomicDelete({
      file: "owned-target",
      error: undefined,
      guard: (): void => undefined,
      quarantined: (): boolean => true,
      occupied: (): boolean => false,
      restore: (): void => {
        throw recovery;
      },
    });
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "undefined primary still precedes recovery failure",
    caught instanceof AggregateError &&
      caught.errors[0] === undefined &&
      caught.errors[1] === recovery,
  );
  let threw: boolean = false;
  try {
    recoverProductionAtomicDelete({
      file: "owned-target",
      error: undefined,
      guard: (): void => undefined,
      quarantined: (): boolean => false,
      occupied: (): boolean => false,
      restore: (): void => undefined,
    });
  } catch (error) {
    threw = error === undefined;
  }
  TestValidator.predicate(
    "undefined original is not mistaken for success",
    threw,
  );
}
