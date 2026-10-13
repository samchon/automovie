import { TestValidator } from "@nestia/e2e";

import { ProcessOwnershipUnit } from "../internal/ProcessOwnershipUnit";
import { createProcessOwnershipHostFacts } from "../internal/createProcessOwnershipHostFacts";
import { observeThrownValue } from "../internal/observeThrownValue";
import { throwsError } from "../internal/predicates";

/**
 * Capture authority belongs to the original child-observation object and its
 * first actual creation identity. Later discovery cannot replace that identity,
 * and absent or failed discovery grants no stop permission.
 *
 * Scenarios:
 *
 * 1. Re-capture performs no new discovery; another object with the same PID
 *    cannot borrow authority, and a changed current birth refuses termination.
 * 2. An absent identity can recover through later capture, while a failed
 *    discovery preserves its exact Error and leaves the child unstamped.
 * 3. Missing PID, code-ended and signal-ended observations request no effects.
 */
export const test_process_ownership_capture = (): void => {
  const { facts, host } = createProcessOwnershipHostFacts(false);
  const controller = new ProcessOwnershipUnit.Controller(host);
  const child = { pid: 10, exitCode: null as number | null, signalCode: null as NodeJS.Signals | null };
  facts.identities.set(10, "birth-a");
  TestValidator.equals("discovery confirms the arranged identity", controller.read(10), "birth-a");
  facts.calls.length = 0;
  controller.own(child);
  facts.identities.set(10, "birth-b");
  controller.own(child);
  TestValidator.equals("capture occurs once", facts.calls, [{ kind: "read", pid: 10 }]);
  TestValidator.predicate("reused current allocation refuses", throwsError(() => controller.stopChild(child), "reused"));
  TestValidator.equals("reuse causes discovery without a signal", facts.calls, [
    { kind: "read", pid: 10 }, { kind: "read", pid: 10 },
  ]);
  const otherObject = { ...child };
  TestValidator.predicate("same PID cannot borrow object authority", throwsError(() => controller.stopChild(otherObject), "captured"));
  facts.identities.set(10, "birth-a");
  controller.stopChild(child);
  TestValidator.equals("matching capture requests one signal", facts.calls.at(-1), { kind: "signal", pid: 10 });

  const absent = { pid: 20, exitCode: null, signalCode: null };
  facts.identities.set(20, null);
  controller.own(absent);
  TestValidator.predicate("absence grants no authority", throwsError(() => controller.stopChild(absent), "captured"));
  facts.identities.set(20, "birth-c");
  controller.own(absent);
  controller.stopChild(absent);
  TestValidator.equals("later discovery recovers capture", facts.calls.at(-1), { kind: "signal", pid: 20 });

  const failed = { pid: 30, exitCode: null, signalCode: null };
  const failure = new Error("identity service unavailable");
  facts.readError = failure;
  const observed = observeThrownValue(() => controller.own(failed));
  TestValidator.predicate("original discovery failure propagates", observed.threw && observed.error === failure);
  facts.readError = null;
  TestValidator.predicate("failed capture grants no authority", throwsError(() => controller.stopChild(failed), "captured"));

  facts.calls.length = 0;
  controller.own({ pid: undefined, exitCode: null, signalCode: null });
  controller.stopChild({ pid: undefined, exitCode: null, signalCode: null });
  controller.stopChild({ pid: 10, exitCode: 0, signalCode: null });
  controller.stopChild({ pid: 10, exitCode: null, signalCode: "SIGTERM" });
  TestValidator.equals("ended or uncreated children cause no host request", facts.calls, []);
};
