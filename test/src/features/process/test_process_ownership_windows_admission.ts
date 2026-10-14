import { TestValidator } from "@nestia/e2e";

import { ProcessOwnershipUnit } from "../internal/ProcessOwnershipUnit";
import { createProcessOwnershipHostFacts } from "../internal/createProcessOwnershipHostFacts";
import { observeThrownValue } from "../internal/observeThrownValue";
import { throwsError } from "../internal/predicates";

/**
 * Windows stop admission selects a complete parent-first identity set before
 * requesting its native effect. Missing roots do nothing; a reused root or an
 * ambiguous snapshot cannot reach the termination host.
 *
 * Scenarios:
 *
 * 1. A matching root admits its newer child while excluding a sibling and a
 *    stale parent link; the snapshot remains unchanged.
 * 2. Missing, mismatched and duplicate root records refuse or skip effects as
 *    specified, with an adjacent matching singleton accepted.
 * 3. Snapshot and termination failures retain their exact Error, and successful
 *    retry consumes fresh observations rather than a cached termination plan.
 *
 * @evidence contracts/testing.md#behavioral-verification Stops through the production ownership controller with authored Windows snapshots, asserting parent-first admitted targets, unchanged source facts, snapshot-only refusals and original host failures followed by fresh recovery.
 * @evidence contracts/testing.md#independent-expectations Exact creation stamps and strictly newer child ancestry independently define the target set and request order. The recorder proves portable admission semantics, not acquisition, verification or termination of real native handles.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts a newer child with sibling/stale links, absent/reused/duplicate roots, singleton recovery and snapshot/termination errors; broader tree boundaries and native transport decoding belong to neighboring process units.
 * @evidence contracts/testing.md#execution-ownership The named exported unit reaches production controller source through the existing loader and fact recorder; it starts no native process or other host and dynamically registers no cases.
 */
export function test_process_ownership_windows_admission(): void {
  const { facts, host }: ReturnType<typeof createProcessOwnershipHostFacts> =
    createProcessOwnershipHostFacts(true);
  const controller: InstanceType<typeof ProcessOwnershipUnit.Controller> =
    new ProcessOwnershipUnit.Controller(host);
  facts.snapshot = [
    { pid: 20, parentPid: 10, createdAt: "200" },
    { pid: 30, parentPid: 1, createdAt: "300" },
    { pid: 40, parentPid: 10, createdAt: "90" },
    { pid: 10, parentPid: 1, createdAt: "100" },
  ];
  const before: typeof facts.snapshot = structuredClone(facts.snapshot);
  TestValidator.equals(
    "matching root exists",
    facts.snapshot.find(
      (item: (typeof facts.snapshot)[number]): boolean => item.pid === 10,
    )?.createdAt,
    "100",
  );
  controller.stop(10, "100");
  TestValidator.equals(
    "only admitted identities reach native termination",
    facts.calls,
    [
      { kind: "snapshot" },
      {
        kind: "windows-stop",
        targets: [
          { pid: 10, createdAt: "100" },
          { pid: 20, createdAt: "200" },
        ],
      },
    ],
  );
  TestValidator.equals("source facts are unchanged", facts.snapshot, before);
  facts.calls.length = 0;
  controller.stop(99, "999");
  TestValidator.equals("absent root performs snapshot only", facts.calls, [
    { kind: "snapshot" },
  ]);
  facts.calls.length = 0;
  TestValidator.predicate(
    "reused root refuses before termination",
    throwsError((): void => controller.stop(10, "99"), "reused"),
  );
  TestValidator.equals("reuse performs snapshot only", facts.calls, [
    { kind: "snapshot" },
  ]);
  facts.snapshot.push({ pid: 10, parentPid: 1, createdAt: "100" });
  TestValidator.predicate(
    "ambiguous identity set refuses",
    throwsError((): void => controller.stop(10, "100"), "ambiguous"),
  );

  facts.snapshot = [{ pid: 10, parentPid: 1, createdAt: "100" }];
  const snapshotFailure: Error = new Error("snapshot unavailable");
  facts.snapshotError = snapshotFailure;
  const failedSnapshot: ReturnType<typeof observeThrownValue> =
    observeThrownValue((): void => controller.stop(10, "100"));
  TestValidator.predicate(
    "snapshot failure is unchanged",
    failedSnapshot.threw && failedSnapshot.error === snapshotFailure,
  );
  facts.snapshotError = null;
  const stopFailure: Error = new Error("native handle refused");
  facts.stopError = stopFailure;
  const failedStop: ReturnType<typeof observeThrownValue> = observeThrownValue(
    (): void => controller.stop(10, "100"),
  );
  TestValidator.predicate(
    "termination failure is unchanged",
    failedStop.threw && failedStop.error === stopFailure,
  );
  facts.stopError = null;
  facts.calls.length = 0;
  controller.stop(10, "100");
  TestValidator.equals("recovery reads a fresh snapshot", facts.calls, [
    { kind: "snapshot" },
    { kind: "windows-stop", targets: [{ pid: 10, createdAt: "100" }] },
  ]);
}
