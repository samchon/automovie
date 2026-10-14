import { TestValidator } from "@nestia/e2e";
import { runProductionMutation } from "../../../../packages/production/src/production/runProductionMutation";
import { cleanupProductionAtomic } from "../../../../packages/production/src/production/cleanupProductionAtomic";

/**
 * A publication notification, not a normal return, determines rollback scope.
 *
 * Scenarios:
 * 1. Successful and empty transactions preserve their result and never restore.
 * 2. Pre-publication failure omits the current write; post-publication cleanup
 *    failure restores it and earlier writes, including deletion, in reverse order.
 * 3. A completion failure restores the whole candidate, while a published
 *    revision retains it and reports the lost acknowledgement without rollback.
 * 4. A replaced namespace is never restored, and rollback failures preserve the
 *    original error while still attempting the remaining owned writes.
 * 5. Cleanup preserves a primary failure, including a thrown undefined value,
 *    and distinguishes cleanup after a successful operation from no publication.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual synchronous mutation coordinator and cleanup owner with explicit publication/commit notifications, observing reverse restoration, resident previous values, returned results and original/aggregate error identity and order.
 * @evidence contracts/testing.md#independent-expectations Independently authored previous/next rows and failure objects define expected rollback scope at each notification boundary. Caller-owned map effects exercise the declared adapter protocol without replacing foreign filesystem methods or pretending to prove real atomic writes.
 * @evidence contracts/testing.md#distinguishing-cases Covers failure before/after each publication, commit acknowledgement loss, initial/during-recovery namespace replacement, restoration failure with continued attempts, empty/successful/no-commit completion and cleanup with no/ordinary/undefined primary cause; physical locking and rename races remain separate transaction tests.
 * @evidence contracts/testing.md#execution-ownership This named portable entry directly imports the canonical owners and owns only rows, maps and synchronous callbacks. It opens no file, process, renderer, browser or GPU and retains no global mutation or dynamic test registration.
 */
export function test_production_mutation_accounting(): void {
  const files: Array<{ id: string; previous: string | null; next: string | null }> = [
    { id: "new-payload", previous: null, next: "new" },
    { id: "manifest", previous: "old", next: "new" },
    { id: "removed", previous: "old", next: null },
  ];
  const primary: Error = new Error("synthetic operation failure");
  const cleanup: Error = new Error("synthetic cleanup failure");
  const identity: Error = new Error("synthetic namespace replacement");
  const recovery: Error = new Error("synthetic rollback failure");
  for (const stage of ["before", "after"] as const)
    for (const stop of files.keys()) {
      const resident: Map<string, string | null> = new Map(files.map((file: (typeof files)[number]): [string, string | null] => [file.id, file.previous]));
      const restored: string[] = [];
      let caught: unknown;
      try {
        runProductionMutation({
          files,
          guard: (): void => undefined,
          apply: (file: (typeof files)[number], published: () => void): void => {
            if (file === files[stop] && stage === "before") throw primary;
            resident.set(file.id, file.next);
            published();
            if (file === files[stop] && stage === "after")
              cleanupProductionAtomic("candidate.tmp", undefined, (): void => {
                throw cleanup;
              });
          },
          restore: (file: (typeof files)[number]): void => {
            restored.push(file.id);
            resident.set(file.id, file.previous);
          },
          complete: (): never => {
            throw new Error("failure must prevent completion");
          },
        });
      } catch (error) {
        caught = error;
      }
      TestValidator.equals(
        `rollback boundary ${stage} ${stop}`,
        restored,
        files
          .slice(0, stop + Number(stage === "after"))
          .reverse()
          .map((file: (typeof files)[number]): string => file.id),
      );
      TestValidator.equals(
        `previous state ${stage} ${stop}`,
        [...resident],
        files.map((file: (typeof files)[number]): [string, string | null] => [file.id, file.previous]),
      );
      TestValidator.predicate(
        `original failure ${stage} ${stop}`,
        stage === "before"
          ? caught === primary
          : caught instanceof AggregateError && caught.errors[0] === cleanup,
      );
    }

  for (const commit of [false, true]) {
    const restored: string[] = [];
    let caught: unknown;
    try {
      runProductionMutation({
        files,
        guard: (): void => undefined,
        apply: (_file: (typeof files)[number], published: () => void): void => published(),
        restore: (file: (typeof files)[number]): void => {
          restored.push(file.id);
        },
        complete: (committed: () => void): never => {
          if (commit) committed();
          throw primary;
        },
      });
    } catch (error) {
      caught = error;
    }
    TestValidator.equals(
      `revision boundary ${commit}`,
      restored,
      commit ? [] : [...files].reverse().map((file: (typeof files)[number]): string => file.id),
    );
    TestValidator.predicate(
      `committed state is explicit ${commit}`,
      commit
        ? caught instanceof AggregateError &&
            caught.errors[0] === primary &&
            caught.message.includes("revision was committed")
        : caught === primary,
    );
  }

  for (const replace of [true, false]) {
    let owned: boolean = true;
    const restored: string[] = [];
    let caught: unknown;
    try {
      runProductionMutation({
        files,
        guard: (): void => {
          if (!owned) throw identity;
        },
        apply: (file: (typeof files)[number], published: () => void): void => {
          if (replace && file === files[1]) owned = false;
          published();
        },
        restore: (file: (typeof files)[number]): void => {
          restored.push(file.id);
          if (file === files[1]) throw recovery;
        },
        complete: (): never => {
          throw primary;
        },
      });
    } catch (error) {
      caught = error;
    }
    TestValidator.equals(
      "replacement or incomplete rollback",
      restored,
      replace ? [] : [...files].reverse().map((file: (typeof files)[number]): string => file.id),
    );
    TestValidator.predicate(
      "failure ordering is preserved",
      caught instanceof AggregateError &&
        (replace
          ? caught.errors[0] === identity && caught.errors[1] === identity
          : caught.errors[0] === primary && caught.errors[1] === recovery),
    );
  }

  let owned: boolean = true;
  const restores: string[] = [];
  let namespaceDuringRecovery: unknown;
  try {
    runProductionMutation({
      files,
      guard: (): void => {
        if (!owned) throw identity;
      },
      apply: (_file: (typeof files)[number], published: () => void): void => published(),
      restore: (file: (typeof files)[number]): void => {
        restores.push(file.id);
        owned = false;
      },
      complete: (): never => {
        throw primary;
      },
    });
  } catch (error) {
    namespaceDuringRecovery = error;
  }
  TestValidator.equals("later rollback paths remain untouched", restores, [
    files[2]!.id,
  ]);
  TestValidator.predicate(
    "rollback guard errors follow primary failure",
    namespaceDuringRecovery instanceof AggregateError &&
      namespaceDuringRecovery.errors[0] === primary &&
      namespaceDuringRecovery.errors
        .slice(1)
        .every((error: unknown): boolean => error === identity),
  );

  for (const values of [[], files]) {
    const published: string[] = [];
    let restored: boolean = false;
    const result: string = runProductionMutation({
      files: values,
      guard: (): void => undefined,
      apply: (file: (typeof files)[number], notify: () => void): void => {
        published.push(file.id);
        notify();
      },
      restore: (): void => {
        restored = true;
      },
      complete: (committed: () => void): string => {
        committed();
        return "committed-result";
      },
    });
    TestValidator.equals("successful result", result, "committed-result");
    TestValidator.equals(
      "each write published once",
      published,
      values.map((file: (typeof files)[number]): string => file.id),
    );
    TestValidator.predicate("success never restores", !restored);
  }
  TestValidator.equals(
    "unchanged completion needs no commit marker",
    runProductionMutation({
      files: [],
      guard: (): void => undefined,
      apply: (): void => undefined,
      restore: (): void => undefined,
      complete: (): string => "unchanged",
    }),
    "unchanged",
  );

  for (const failure of [undefined, { error: primary }, { error: undefined }]) {
    let removed: boolean = false;
    cleanupProductionAtomic("candidate.tmp", failure, (): void => {
      removed = true;
    });
    TestValidator.predicate("successful cleanup stays silent", removed);
    let caught: unknown;
    try {
      cleanupProductionAtomic("candidate.tmp", failure, (): void => {
        throw cleanup;
      });
    } catch (error) {
      caught = error;
    }
    TestValidator.predicate(
      "cleanup includes every failure in causal order",
      caught instanceof AggregateError &&
        (failure === undefined
          ? caught.errors.length === 1 &&
            caught.errors[0] === cleanup &&
            caught.message.includes("operation completed")
          : caught.errors.length === 2 &&
            caught.errors[0] === failure.error &&
            caught.errors[1] === cleanup),
    );
  }
}
