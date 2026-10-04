import { TestValidator } from "@nestia/e2e";
import { getEventListeners } from "node:events";

import { createHumanViewerQueue } from "../../../scripts/human-viewer/createHumanViewerQueue";
import { rejectsWith } from "../internal/rejectsWith";

/**
 * Cancellation withdraws waiting work without releasing an unsettled GPU task.
 *
 * Scenarios:
 * 1. Pre-abort and an abort during admission start no callback. Removing one
 *    waiter preserves the other waiters' order and restores lane capacity.
 * 2. Active cancellation rejects the requester immediately but keeps the slot
 *    until success or failure settles; the next request then recovers.
 * 3. A clock callback abort before physical start invokes no task. Completed
 *    listeners and cancelled quiet-period bulk entries leave no live work.
 */
export const test_human_viewer_queue_cancellation = async (): Promise<void> => {
  const deferred = () => {
    let release!: (value: undefined) => void;
    let fail!: (error: Error) => void;
    const promise = new Promise<undefined>((resolve, reject) => {
      release = resolve;
      fail = reject;
    });
    return { promise, resolve: () => release(undefined), reject: fail };
  };
  const create = () =>
    createHumanViewerQueue({ limit: 2, patience: 2, now: () => 0 });
  let calls = 0;
  const pre = new AbortController();
  pre.abort(new Error("before admission"));
  const empty = create();
  TestValidator.predicate(
    "pre-aborted work is refused without invocation",
    await rejectsWith(
      () => empty.run("pre", async () => ++calls, "cli", pre.signal),
      "before admission",
    ),
  );
  TestValidator.equals(
    "pre-abort leaves no work or last result",
    [calls, empty.status().last],
    [0, null],
  );

  const queue = create();
  const held = deferred();
  const order: string[] = [];
  const first = queue.run("first", async () => {
    order.push("first");
    await held.promise;
  });
  const cancel = new AbortController();
  const removed = queue
    .run(
      "removed",
      async () => {
        order.push("removed");
      },
      "cli",
      cancel.signal,
    )
    .catch((error: unknown) => {
      if (!(error instanceof Error))
        throw new Error("Expected cancellation Error");
      return error.message;
    });
  const retained = queue.run("retained", async () => {
    order.push("retained");
  });
  TestValidator.equals(
    "cancellation listener is attached while waiting",
    getEventListeners(cancel.signal, "abort").length,
    1,
  );
  cancel.abort(new Error("waiting cancelled"));
  TestValidator.equals(
    "waiting cancellation result",
    await removed,
    "waiting cancelled",
  );
  TestValidator.equals(
    "only the cancelled waiter is removed",
    [queue.status().waiting.cli, queue.status().last],
    [1, null],
  );
  TestValidator.equals(
    "waiting listener cleaned",
    getEventListeners(cancel.signal, "abort").length,
    0,
  );
  const replacement = queue.run("replacement", async () => {
    order.push("replacement");
  });
  held.resolve();
  await Promise.all([first, retained, replacement]);
  TestValidator.equals("remaining FIFO and freed capacity", order, [
    "first",
    "retained",
    "replacement",
  ]);

  for (const fail of [false, true]) {
    const active = create();
    const physical = deferred();
    const nextStarted = deferred();
    const nextPhysical = deferred();
    const controller = new AbortController();
    let running = 0;
    let maximum = 0;
    const request = active
      .run(
        "active",
        async () => {
          running++;
          maximum = Math.max(maximum, running);
          try {
            await physical.promise;
          } finally {
            running--;
          }
        },
        "cli",
        controller.signal,
      )
      .catch((error: unknown) => {
        if (!(error instanceof Error))
          throw new Error("Expected cancellation Error");
        return error.message;
      });
    const next = active.run("next", async () => {
      running++;
      maximum = Math.max(maximum, running);
      nextStarted.resolve();
      await nextPhysical.promise;
      running--;
      return 7;
    });
    controller.abort(new Error("active cancelled"));
    TestValidator.equals(
      "active requester rejected",
      await request,
      "active cancelled",
    );
    TestValidator.equals(
      "physical slot still held",
      [active.status().running, active.status().waiting.cli, running],
      ["active", 1, 1],
    );
    if (fail) physical.reject(new Error("physical failure"));
    else physical.resolve();
    await nextStarted.promise;
    TestValidator.equals(
      "cancelled completion is failed and never overlaps",
      [active.status().last?.failed, maximum],
      [true, 1],
    );
    nextPhysical.resolve();
    TestValidator.equals("next request recovers", await next, 7);
    TestValidator.equals(
      "completed active listener cleaned",
      getEventListeners(controller.signal, "abort").length,
      0,
    );
  }

  for (const abortAt of [1, 2]) {
    const controller = new AbortController();
    let ticks = 0;
    const raced = createHumanViewerQueue({
      limit: 1,
      patience: 1,
      now: () => {
        if (++ticks === abortAt)
          controller.abort(new Error("clock cancellation"));
        return 0;
      },
    });
    TestValidator.predicate(
      "admission and start clock cancellation invoke no physical work",
      await rejectsWith(
        () => raced.run("raced", async () => ++calls, "cli", controller.signal),
        "clock cancellation",
      ),
    );
  }
  TestValidator.equals("no cancelled callback was invoked", calls, 0);
  const done = new AbortController();
  TestValidator.equals(
    "successful signal-bearing work",
    await empty.run("done", async () => 3, "cli", done.signal),
    3,
  );
  done.abort();
  TestValidator.equals(
    "late abort does not rewrite completed result",
    empty.status().last?.failed,
    false,
  );
  TestValidator.equals(
    "success listener cleaned",
    getEventListeners(done.signal, "abort").length,
    0,
  );

  const delayed: Array<() => void> = [];
  const quiet = createHumanViewerQueue({
    limit: 1,
    patience: 1,
    now: () => 0,
    quietMs: 10,
    later: (run) => {
      delayed.push(run);
    },
  });
  await quiet.run("foreground", async () => 1);
  const bulkAbort = new AbortController();
  const bulk = quiet
    .run("bulk", async () => ++calls, "bulk", bulkAbort.signal)
    .catch(() => undefined);
  bulkAbort.abort();
  await bulk;
  delayed[0]!();
  TestValidator.equals(
    "cancelled quiet bulk never runs",
    [quiet.status().waiting.bulk, calls],
    [0, 0],
  );
};
