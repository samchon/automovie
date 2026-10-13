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
 */
export const test_process_ownership_windows_admission = (): void => {
  const { facts, host } = createProcessOwnershipHostFacts(true);
  const controller = new ProcessOwnershipUnit.Controller(host);
  facts.snapshot = [
    { pid: 20, parentPid: 10, createdAt: "200" },
    { pid: 30, parentPid: 1, createdAt: "300" },
    { pid: 40, parentPid: 10, createdAt: "90" },
    { pid: 10, parentPid: 1, createdAt: "100" },
  ];
  const before = structuredClone(facts.snapshot);
  TestValidator.equals("matching root exists", facts.snapshot.find((item) => item.pid === 10)?.createdAt, "100");
  controller.stop(10, "100");
  TestValidator.equals("only admitted identities reach native termination", facts.calls, [
    { kind: "snapshot" },
    { kind: "windows-stop", targets: [{ pid: 10, createdAt: "100" }, { pid: 20, createdAt: "200" }] },
  ]);
  TestValidator.equals("source facts are unchanged", facts.snapshot, before);
  facts.calls.length = 0;
  controller.stop(99, "999");
  TestValidator.equals("absent root performs snapshot only", facts.calls, [{ kind: "snapshot" }]);
  facts.calls.length = 0;
  TestValidator.predicate("reused root refuses before termination", throwsError(() => controller.stop(10, "99"), "reused"));
  TestValidator.equals("reuse performs snapshot only", facts.calls, [{ kind: "snapshot" }]);
  facts.snapshot.push({ pid: 10, parentPid: 1, createdAt: "100" });
  TestValidator.predicate("ambiguous identity set refuses", throwsError(() => controller.stop(10, "100"), "ambiguous"));

  facts.snapshot = [{ pid: 10, parentPid: 1, createdAt: "100" }];
  const snapshotFailure = new Error("snapshot unavailable");
  facts.snapshotError = snapshotFailure;
  const failedSnapshot = observeThrownValue(() => controller.stop(10, "100"));
  TestValidator.predicate("snapshot failure is unchanged", failedSnapshot.threw && failedSnapshot.error === snapshotFailure);
  facts.snapshotError = null;
  const stopFailure = new Error("native handle refused");
  facts.stopError = stopFailure;
  const failedStop = observeThrownValue(() => controller.stop(10, "100"));
  TestValidator.predicate("termination failure is unchanged", failedStop.threw && failedStop.error === stopFailure);
  facts.stopError = null;
  facts.calls.length = 0;
  controller.stop(10, "100");
  TestValidator.equals("recovery reads a fresh snapshot", facts.calls, [
    { kind: "snapshot" }, { kind: "windows-stop", targets: [{ pid: 10, createdAt: "100" }] },
  ]);
};
