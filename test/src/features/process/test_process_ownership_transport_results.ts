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
 *
 * @evidence contracts/testing.md#behavioral-verification Decodes supplied native transport results through production Windows/POSIX owners, asserting exact successful payloads, absence, malformed JSON, original spawn errors and diagnostic-bearing failed exits.
 * @evidence contracts/testing.md#independent-expectations Authored JSON/date text and the fixed transports' supported exit statuses define results independently of decoder output. Parsed Windows JSON is not an independently validated process-record schema, and no native command runs here.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts present/absent/structured Windows payloads, whitespace, malformed JSON, spawn-error priority, nonzero/null exits and POSIX supported 0/1 versus other outcomes; controller stop permission and Linux stat parsing belong to neighboring units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit calls production decoders through the existing source-module bridge with value records and owns all assertions; no process or OS host is started and no cases are dynamically registered.
 */
export function test_process_ownership_transport_results(): void {
  const result: Parameters<typeof ProcessOwnershipUnit.windowsResult>[0] = { status: 0, stdout: " \"63927358885700106\"\n", stderr: "" };
  TestValidator.equals("Windows exact birth stamp", ProcessOwnershipUnit.windowsResult(result), "63927358885700106");
  TestValidator.equals("Windows absent identity", ProcessOwnershipUnit.windowsResult({ ...result, stdout: " null " }), null);
  TestValidator.equals("Windows structured snapshot", ProcessOwnershipUnit.windowsResult({ ...result, stdout: '[{"pid":10,"parentPid":1,"createdAt":"100"}]' }), [
    { pid: 10, parentPid: 1, createdAt: "100" },
  ]);
  TestValidator.predicate("malformed native payload refuses", throwsError((): unknown => ProcessOwnershipUnit.windowsResult({ ...result, stdout: "not-json" })));
  const spawnFailure: Error = new Error("native transport unavailable");
  const failedSpawn: ReturnType<typeof observeThrownValue> = observeThrownValue((): unknown => ProcessOwnershipUnit.windowsResult({ ...result, error: spawnFailure, status: 7 }));
  TestValidator.predicate("Windows keeps the spawn Error", failedSpawn.threw && failedSpawn.error === spawnFailure);
  for (const status of [1, 7, null])
    TestValidator.predicate("Windows failed exit refuses", throwsError((): unknown => ProcessOwnershipUnit.windowsResult({ ...result, status, stderr: " host denied \n" }), "host denied"));
  for (const status of [0, 1]) {
    TestValidator.equals("POSIX present date", ProcessOwnershipUnit.posixIdentity({ status, stdout: " Tue Oct 13 12:00:00 2026\n", stderr: "" }), "Tue Oct 13 12:00:00 2026");
    TestValidator.equals("POSIX empty date", ProcessOwnershipUnit.posixIdentity({ status, stdout: " \n", stderr: "" }), null);
  }
  const failedPosixSpawn: ReturnType<typeof observeThrownValue> = observeThrownValue((): string | null => ProcessOwnershipUnit.posixIdentity({ ...result, error: spawnFailure, status: 7 }));
  TestValidator.predicate("POSIX keeps the spawn Error", failedPosixSpawn.threw && failedPosixSpawn.error === spawnFailure);
  for (const status of [2, 7, null])
    TestValidator.predicate("POSIX failed exit refuses", throwsError((): string | null => ProcessOwnershipUnit.posixIdentity({ ...result, status, stderr: "ps unavailable" }), "ps unavailable"));
}
