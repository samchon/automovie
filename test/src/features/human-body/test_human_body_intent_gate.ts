import { createBodyIntentGate } from "@automovie/playground/src/human/createBodyIntentGate";
import { TestValidator } from "@nestia/e2e";

const deferred = <T>() => {
  let fulfill!: (value: T) => void;
  let fail!: (reason: Error) => void;
  const promise = new Promise<T>((resolve, reject) => {
    fulfill = resolve;
    fail = reject;
  });
  return { promise, resolve: fulfill, reject: fail };
};

/**
 * Intent is ordered when requested, before asynchronous work completes.
 * The latest successful body and status survive both stale outcomes.
 *
 * Scenarios:
 * 1. A slow old success cannot replace a newer committed shape.
 * 2. A slow old failure cannot replace the newer ready status.
 * 3. A sole completion succeeds and a sole failure reports its error.
 * 4. Undo and reset reservations retire an older pending solve.
 */
export const test_human_body_intent_gate = async (): Promise<void> => {
  const gate = createBodyIntentGate();
  let shape = "neutral";
  let status = "ready";
  const start = async (pending: Promise<string>): Promise<void> => {
    const ticket = gate.reserve();
    status = "building";
    try {
      const value = await pending;
      if (gate.isCurrent(ticket)) {
        shape = value;
        status = "ready";
      }
    } catch (error) {
      if (gate.isCurrent(ticket))
        status = error instanceof Error ? error.message : String(error);
    }
  };

  const oldSuccess = deferred<string>();
  const oldSuccessTask = start(oldSuccess.promise);
  const newerSuccess = deferred<string>();
  const newerSuccessTask = start(newerSuccess.promise);
  newerSuccess.resolve("male");
  await newerSuccessTask;
  oldSuccess.resolve("slender woman");
  await oldSuccessTask;
  TestValidator.equals(
    "late success cannot overwrite newer body",
    shape,
    "male",
  );
  TestValidator.equals("late success leaves ready status", status, "ready");

  const oldFailure = deferred<string>();
  const oldFailureTask = start(oldFailure.promise);
  const next = start(Promise.resolve("broad shoulders"));
  await next;
  oldFailure.reject(new Error("old solve failed"));
  await oldFailureTask;
  TestValidator.equals(
    "late failure leaves newer body",
    shape,
    "broad shoulders",
  );
  TestValidator.equals("late failure leaves ready status", status, "ready");

  await start(Promise.resolve("sole preset"));
  TestValidator.equals("sole preset applies", shape, "sole preset");
  await start(Promise.reject(new Error("sole solve failed")));
  TestValidator.equals("sole failure preserves body", shape, "sole preset");
  TestValidator.equals(
    "sole failure reports its error",
    status,
    "sole solve failed",
  );

  for (const action of ["undo", "reset"]) {
    const pending = deferred<string>();
    const task = start(pending.promise);
    gate.reserve();
    shape = action;
    status = "ready";
    pending.resolve("stale preset");
    await task;
    TestValidator.equals(`${action} retires an old preset`, shape, action);
    TestValidator.equals(`${action} status survives`, status, "ready");
  }
};
