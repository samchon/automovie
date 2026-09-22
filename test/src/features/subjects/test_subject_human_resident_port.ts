import { createHumanResidentPort } from "@automovie/playground/src/human/residentPort";
import { TestValidator } from "@nestia/e2e";

/**
 * The browser adapter forwards native events without allocating a real worker.
 *
 * Scenarios:
 * 1. Requests, replies and transport errors preserve their payload.
 * 2. Null callbacks detach safely and termination reaches the native port.
 */
export const test_subject_human_resident_port = (): void => {
  const sent: unknown[] = [],
    replies: unknown[] = [],
    errors: string[] = [];
  let stopped = 0;
  const worker: Pick<
    Worker,
    "onmessage" | "onerror" | "postMessage" | "terminate"
  > = {
    onmessage: null,
    onerror: null,
    postMessage: (value) => {
      sent.push(value);
    },
    terminate: () => {
      stopped++;
    },
  };
  const port = createHumanResidentPort<string, number>(worker);
  port.onmessage = (event) => {
    replies.push(event.data);
  };
  port.onerror = (event) => {
    errors.push(event.message);
  };
  const invoke = <Event>(callback: unknown, event: Event): void => {
    (callback as (event: Event) => void)(event);
  };
  const reply = { id: 3, success: true, value: 5 };
  invoke(worker.onmessage, { data: reply });
  invoke(worker.onerror, { message: "lost" });
  port.postMessage({ id: 3, input: "face" });
  TestValidator.equals("native request", sent, [{ id: 3, input: "face" }]);
  TestValidator.equals("native response", replies, [reply]);
  TestValidator.equals("native failure", errors, ["lost"]);
  port.onmessage = null;
  port.onerror = null;
  invoke(worker.onmessage, { data: reply });
  invoke(worker.onerror, { message: "late" });
  TestValidator.equals("detached replies", replies.length, 1);
  TestValidator.equals("detached errors", errors.length, 1);
  port.terminate();
  TestValidator.equals("native termination", stopped, 1);
};
