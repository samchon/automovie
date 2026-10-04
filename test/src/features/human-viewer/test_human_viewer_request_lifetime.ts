import { TestValidator } from "@nestia/e2e";
import { EventEmitter } from "node:events";

import { HumanViewerStartingError } from "../../../scripts/human-viewer/HumanViewerStartingError";
import { createHumanViewerQueue } from "../../../scripts/human-viewer/createHumanViewerQueue";
import { queueHumanViewerRequest } from "../../../scripts/human-viewer/queueHumanViewerRequest";

/**
 * HTTP response closure cancels requests without racing physical page work.
 *
 * Scenarios:
 * 1. Healthy finished responses and completed operation values are preserved;
 *    preclosed and queued-aborted requests never invoke their callbacks.
 * 2. Active disconnect discards the result only after actual operation
 *    settlement, preserves serialization and admits the next healthy request.
 * 3. Normal errors retain existing refusal/retry policy, destroyed responses
 *    receive no writes and every completion removes its close listener.
 */
export const test_human_viewer_request_lifetime = async (): Promise<void> => {
  const deferred = () => {
    let release!: (value: undefined) => void;
    const promise = new Promise<undefined>((resolve) => {
      release = resolve;
    });
    return { promise, resolve: () => release(undefined) };
  };
  const response = (destroyed = false, writableFinished = false) => {
    const events = new EventEmitter();
    return {
      destroyed,
      writableFinished,
      statusCode: 200,
      headers: [] as Array<[string, string]>,
      bodies: [] as string[],
      on: (event: "close", listener: () => void) => events.on(event, listener),
      off: (event: "close", listener: () => void) =>
        events.off(event, listener),
      setHeader(name: string, value: string) {
        this.headers.push([name, value]);
      },
      end(body: string) {
        this.bodies.push(body);
      },
      close() {
        this.destroyed = true;
        events.emit("close");
      },
      listeners: () => events.listenerCount("close"),
    };
  };
  const queue = () =>
    createHumanViewerQueue({ limit: 1, patience: 1, now: () => 0 });
  const healthy = response();
  TestValidator.equals(
    "guarded value retained",
    await queueHumanViewerRequest({
      queue: queue(),
      response: healthy,
      label: "ok",
      lane: "cli",
      task: (request) => request.run(async () => 7),
    }),
    7,
  );
  TestValidator.equals("healthy listener cleaned", healthy.listeners(), 0);
  const finished = response(true, true);
  TestValidator.equals(
    "already finished close is not a cancellation",
    await queueHumanViewerRequest({
      queue: queue(),
      response: finished,
      label: "finished",
      lane: "cli",
      task: async () => 8,
    }),
    8,
  );

  let calls = 0;
  const closed = response(true);
  await queueHumanViewerRequest({
    queue: queue(),
    response: closed,
    label: "closed",
    lane: "cli",
    task: async () => ++calls,
  });
  TestValidator.equals(
    "preclosed work and response writes absent",
    [calls, closed.bodies, closed.listeners()],
    [0, [], 0],
  );

  const waitingQueue = queue();
  const held = deferred();
  const active = waitingQueue.run("first", () => held.promise);
  const waiting = response();
  const withdrawn = queueHumanViewerRequest({
    queue: waitingQueue,
    response: waiting,
    label: "waiting",
    lane: "cli",
    task: async () => ++calls,
  });
  waiting.close();
  await withdrawn;
  TestValidator.equals(
    "disconnected waiting request removed",
    [waitingQueue.status().waiting.cli, calls, waiting.listeners()],
    [0, 0, 0],
  );
  held.resolve();
  await active;

  const physical = deferred();
  const workStarted = deferred();
  const physicalDone = deferred();
  const single = queue();
  const lost = response();
  let inFlight = 0;
  let maximum = 0;
  const running = queueHumanViewerRequest({
    queue: single,
    response: lost,
    label: "lost",
    lane: "cli",
    task: (request) =>
      request.run(async () => {
        inFlight++;
        maximum = Math.max(maximum, inFlight);
        workStarted.resolve();
        await physical.promise;
        inFlight--;
        physicalDone.resolve();
        return 1;
      }),
  });
  await workStarted.promise;
  lost.close();
  lost.close();
  await running;
  const nextResponse = response();
  const next = queueHumanViewerRequest({
    queue: single,
    response: nextResponse,
    label: "next",
    lane: "cli",
    task: (request) =>
      request.run(async () => {
        inFlight++;
        maximum = Math.max(maximum, inFlight);
        inFlight--;
        return 9;
      }),
  });
  TestValidator.equals(
    "client loss does not release active physical slot",
    [single.status().running, single.status().waiting.cli, inFlight],
    ["lost", 1, 1],
  );
  physical.resolve();
  await physicalDone.promise;
  TestValidator.equals(
    "next request recovers without overlap",
    [await next, maximum],
    [9, 1],
  );
  TestValidator.equals(
    "closed response has no writes and no listener",
    [lost.bodies, lost.headers, lost.listeners()],
    [[], [], 0],
  );

  const normalClose = response();
  const normalGate = deferred();
  let signal!: AbortSignal;
  const normal = queueHumanViewerRequest({
    queue: queue(),
    response: normalClose,
    label: "normal-close",
    lane: "cli",
    task: (request) => {
      signal = request.signal;
      return request.run(async () => {
        await normalGate.promise;
        return 4;
      });
    },
  });
  normalClose.writableFinished = true;
  normalClose.close();
  TestValidator.equals(
    "finished response close keeps signal live",
    signal.aborted,
    false,
  );
  normalGate.resolve();
  TestValidator.equals(
    "finished operation remains successful",
    await normal,
    4,
  );

  const beforeRun = response();
  await queueHumanViewerRequest({
    queue: queue(),
    response: beforeRun,
    label: "before-run",
    lane: "cli",
    task: async (request) => {
      beforeRun.close();
      await request.run(async () => ++calls);
    },
  });
  TestValidator.equals("operation guard refuses before invocation", calls, 0);
  for (const error of [
    new Error("invalid address"),
    new HumanViewerStartingError("starting"),
  ]) {
    const refused = response();
    await queueHumanViewerRequest({
      queue: queue(),
      response: refused,
      label: "refusal",
      lane: "cli",
      task: (request) => request.run(() => Promise.reject(error)),
    });
    TestValidator.equals(
      "refusal status retained",
      refused.statusCode,
      error instanceof HumanViewerStartingError ? 503 : 422,
    );
    TestValidator.predicate(
      "refusal body and cleanup",
      refused.bodies[0]!.includes(error.message) && refused.listeners() === 0,
    );
    TestValidator.equals(
      "existing retry policy retained",
      refused.headers.some(
        ([name, value]) => name === "Retry-After" && value === "3",
      ),
      error instanceof HumanViewerStartingError,
    );
  }
  // AbortSignal.reason is caller-owned and may be a non-Error. Exercise that
  // actual upstream cancellation boundary, not an invalid Promise.reject call.
  const upstream = new AbortController();
  upstream.abort("upstream cancellation");
  const upstreamQueue = queue();
  const propagated = response();
  await queueHumanViewerRequest({
    queue: queue(),
    response: propagated,
    label: "upstream",
    lane: "cli",
    task: (request) =>
      request.run(() =>
        upstreamQueue.run("upstream", async () => 1, "cli", upstream.signal),
      ),
  });
  TestValidator.equals(
    "upstream cancellation reason is described",
    JSON.parse(propagated.bodies[0]!).error,
    "upstream cancellation",
  );
  const silent = response();
  const destroyedSuccess = response();
  await queueHumanViewerRequest({
    queue: queue(),
    response: destroyedSuccess,
    label: "destroyed-before-close-success",
    lane: "cli",
    task: async (request) => {
      const result = await request.run(async () => {
        destroyedSuccess.destroyed = true;
        return "must not publish";
      });
      destroyedSuccess.end(result);
    },
  });
  TestValidator.equals(
    "successful operation cannot publish to a destroyed response before close",
    destroyedSuccess.bodies,
    [],
  );
  await queueHumanViewerRequest({
    queue: queue(),
    response: silent,
    label: "destroyed-without-close",
    lane: "cli",
    task: async () => {
      silent.destroyed = true;
      throw new Error("failed after disconnect");
    },
  });
  TestValidator.equals(
    "destroyed response never receives an error body",
    silent.bodies,
    [],
  );
};
