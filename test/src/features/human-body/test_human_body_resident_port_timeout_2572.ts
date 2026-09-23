import { createConnectedBodyPort } from "@automovie/playground/src/human/connectedBodyPort";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { throwsError } from "../internal/predicates";

/** One silent request retires its worker; answered requests cancel their clock. */
export const test_human_body_resident_port_timeout_2572 = (): void => {
  const { document } = humanBodyBasisFixture();
  const scheduled: Array<{
    fire: () => void;
    delay: number;
    canceled: boolean;
  }> = [];
  const clock = {
    schedule: (fire: () => void, delay: number) => {
      const task = { fire, delay, canceled: false };
      scheduled.push(task);
      return task;
    },
    cancel: (handle: unknown) => {
      (handle as (typeof scheduled)[number]).canceled = true;
    },
  };
  let stopped = false;
  let sends = 0;
  let error = "";
  const native = {
    onmessage: null as Worker["onmessage"],
    onerror: null as Worker["onerror"],
    onmessageerror: null as Worker["onmessageerror"],
    postMessage: () => {
      ++sends;
    },
    terminate: () => {
      stopped = true;
    },
  };
  const port = createConnectedBodyPort(native, clock);
  port.onmessage = () => {};
  port.onerror = (event) => {
    error = event.message;
  };
  const input = {
    operation: "export" as const,
    document: JSON.stringify(document),
  };
  port.postMessage({ id: 1, input });
  TestValidator.equals("deadline is one minute", scheduled[0].delay, 60_000);
  (native.onmessage as ((event: MessageEvent) => void) | null)?.({
    data: { id: 1, success: true, value: {} },
  } as MessageEvent);
  scheduled[0].fire();
  TestValidator.predicate(
    "answered request cancels timer",
    scheduled[0].canceled && error === "",
  );
  port.postMessage({ id: 2, input });
  scheduled[1].fire();
  TestValidator.predicate(
    "silent worker causes one body-specific transport failure",
    error === "The body worker did not respond within 60 seconds." &&
      sends === 2 &&
      throwsError(
        () => port.postMessage({ id: 3, input }),
        "connection has failed",
      ),
  );
  port.terminate();
  TestValidator.predicate("retired port terminates native worker", stopped);
  let canceled = false;
  const sendFailure = createConnectedBodyPort(
    {
      onmessage: null,
      onerror: null,
      onmessageerror: null,
      postMessage: () => {
        throw new Error("post failed");
      },
      terminate: () => {},
    },
    {
      schedule: () => 5,
      cancel: () => {
        canceled = true;
      },
    },
  );
  TestValidator.predicate(
    "synchronous send failure clears its timer",
    throwsError(
      () => sendFailure.postMessage({ id: 4, input }),
      "post failed",
    ) && canceled,
  );
};
