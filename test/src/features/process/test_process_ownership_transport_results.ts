import { TestValidator } from "@nestia/e2e";

import { ProcessOwnershipUnit } from "../internal/ProcessOwnershipUnit";
import { observeThrownValue } from "../internal/observeThrownValue";
import { throwsError } from "../internal/predicates";

/**
 * Native transport outcomes are interpreted before discovery can supply stop
 * authority. Spawn errors keep their identity, supported exits admit their
 * payload, and failed or malformed responses remain operational failures.
 *
 * Scenarios:
 *
 * 1. Windows successful JSON carries a birth stamp, absent null or snapshot;
 *    whitespace is transport only, and malformed JSON refuses.
 * 2. Windows spawn errors take precedence over status, while failed or
 *    signal-ended statuses preserve the host's diagnostic.
 * 3. POSIX status 0/1 admits a nonempty date or absence; other outcomes refuse
 *    without converting an error into a creation identity.
 */
export const test_process_ownership_transport_results = (): void => {
  const result = { status: 0, stdout: " \"63927358885700106\"\n", stderr: "" };
  TestValidator.equals("Windows exact birth stamp", ProcessOwnershipUnit.windowsResult(result), "63927358885700106");
  TestValidator.equals("Windows absent identity", ProcessOwnershipUnit.windowsResult({ ...result, stdout: " null " }), null);
  TestValidator.equals("Windows structured snapshot", ProcessOwnershipUnit.windowsResult({ ...result, stdout: '[{"pid":10,"parentPid":1,"createdAt":"100"}]' }), [
    { pid: 10, parentPid: 1, createdAt: "100" },
  ]);
  TestValidator.predicate("malformed native payload refuses", throwsError(() => ProcessOwnershipUnit.windowsResult({ ...result, stdout: "not-json" })));
  const spawnFailure = new Error("native transport unavailable");
  const failedSpawn = observeThrownValue(() => ProcessOwnershipUnit.windowsResult({ ...result, error: spawnFailure, status: 7 }));
  TestValidator.predicate("Windows keeps the spawn Error", failedSpawn.threw && failedSpawn.error === spawnFailure);
  for (const status of [1, 7, null])
    TestValidator.predicate("Windows failed exit refuses", throwsError(() => ProcessOwnershipUnit.windowsResult({ ...result, status, stderr: " host denied \n" }), "host denied"));
  for (const status of [0, 1]) {
    TestValidator.equals("POSIX present date", ProcessOwnershipUnit.posixIdentity({ status, stdout: " Tue Oct 13 12:00:00 2026\n", stderr: "" }), "Tue Oct 13 12:00:00 2026");
    TestValidator.equals("POSIX empty date", ProcessOwnershipUnit.posixIdentity({ status, stdout: " \n", stderr: "" }), null);
  }
  const failedPosixSpawn = observeThrownValue(() => ProcessOwnershipUnit.posixIdentity({ ...result, error: spawnFailure, status: 7 }));
  TestValidator.predicate("POSIX keeps the spawn Error", failedPosixSpawn.threw && failedPosixSpawn.error === spawnFailure);
  for (const status of [2, 7, null])
    TestValidator.predicate("POSIX failed exit refuses", throwsError(() => ProcessOwnershipUnit.posixIdentity({ ...result, status, stderr: "ps unavailable" }), "ps unavailable"));
};
