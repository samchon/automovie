import { TestValidator } from "@nestia/e2e";

import { ProcessOwnershipUnit } from "../internal/ProcessOwnershipUnit";
import { createProcessOwnershipHostFacts } from "../internal/createProcessOwnershipHostFacts";
import { observeThrownValue } from "../internal/observeThrownValue";
import { throwsError } from "../internal/predicates";

/**
 * POSIX stop admission checks a positive PID and the recorded creation stamp
 * before requesting one root signal. The identity check and signal remain two
 * effects; this logical scenario does not claim an atomic kernel-held identity.
 *
 * Scenarios:
 *
 * 1. Invalid selectors or absent authority request no host effects, while a
 *    matching recorded identity permits exactly one root signal.
 * 2. Absent or changed discovery performs no signal; operational discovery and
 *    signal errors propagate unchanged, followed by a supported retry.
 * 3. Discovery returns its actual stamp/null and rejects every malformed PID
 *    before it can reach the effect host.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads and stops through the production ownership controller against recorded POSIX facts, asserting pre-effect selector/authority refusal, exact discovery/signal requests and original failures followed by retry.
 * @evidence contracts/testing.md#independent-expectations Authored creation stamps, caller-supplied authority and the contract's root-only signal define the expected request sequence; recorded host requests do not prove real native termination or atomic PID reuse protection.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts malformed selectors, absent authority, matching/absent/changed identities, discovery and signal failures and fresh retry. Original-child capture, Windows ancestry and transport decoding belong to neighboring process units.
 * @evidence contracts/testing.md#execution-ownership The named exported unit reaches production source through the existing ProcessOwnershipUnit loader and supplied fact recorder; it starts no child or OS host and dynamically registers no cases.
 */
export function test_process_ownership_posix_admission(): void {
  const { facts, host }: ReturnType<typeof createProcessOwnershipHostFacts> =
    createProcessOwnershipHostFacts(false);
  const controller: InstanceType<typeof ProcessOwnershipUnit.Controller> =
    new ProcessOwnershipUnit.Controller(host);
  facts.identities.set(10, "boot:1234");
  TestValidator.equals(
    "arranged host identity",
    controller.read(10),
    "boot:1234",
  );
  TestValidator.equals("absent host identity", controller.read(11), null);
  facts.calls.length = 0;
  for (const pid of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    TestValidator.predicate(
      "malformed discovery selector refuses",
      throwsError((): string | null => controller.read(pid), "integer"),
    );
    TestValidator.predicate(
      "malformed stop selector refuses",
      throwsError((): void => controller.stop(pid, "birth"), "integer"),
    );
  }
  TestValidator.predicate(
    "missing authority refuses",
    throwsError((): void => controller.stop(10, ""), "identity"),
  );
  TestValidator.equals("admission refuses before effects", facts.calls, []);
  const accepted: ReturnType<typeof observeThrownValue> = observeThrownValue(
    (): void => controller.stop(10, "boot:1234"),
  );
  TestValidator.equals("supported stop completes", accepted, {
    threw: false,
    error: undefined,
  });
  TestValidator.equals(
    "matching identity requests one root signal",
    facts.calls,
    [
      { kind: "read", pid: 10 },
      { kind: "signal", pid: 10 },
    ],
  );
  facts.calls.length = 0;
  controller.stop(11, "old");
  TestValidator.equals("absence requests discovery only", facts.calls, [
    { kind: "read", pid: 11 },
  ]);
  facts.calls.length = 0;
  TestValidator.predicate(
    "changed incarnation refuses",
    throwsError((): void => controller.stop(10, "older"), "reused"),
  );
  TestValidator.equals("changed incarnation requests no signal", facts.calls, [
    { kind: "read", pid: 10 },
  ]);
  const readFailure: Error = new Error("discovery unavailable");
  facts.readError = readFailure;
  const failedRead: ReturnType<typeof observeThrownValue> = observeThrownValue(
    (): void => controller.stop(10, "boot:1234"),
  );
  TestValidator.predicate(
    "discovery error is unchanged",
    failedRead.threw && failedRead.error === readFailure,
  );
  facts.readError = null;
  const signalFailure: Error = new Error("signal refused");
  facts.signalError = signalFailure;
  const failedSignal: ReturnType<typeof observeThrownValue> =
    observeThrownValue((): void => controller.stop(10, "boot:1234"));
  TestValidator.predicate(
    "signal error is unchanged",
    failedSignal.threw && failedSignal.error === signalFailure,
  );
  facts.signalError = null;
  facts.calls.length = 0;
  controller.stop(10, "boot:1234");
  TestValidator.equals("retry checks a fresh identity", facts.calls, [
    { kind: "read", pid: 10 },
    { kind: "signal", pid: 10 },
  ]);
}
