import { TestValidator } from "@nestia/e2e";

import { HumanViewerQueueFullError } from "../../../scripts/human-viewer/HumanViewerQueueFullError";
import { createHumanViewerQueue } from "../../../scripts/human-viewer/createHumanViewerQueue";
import { rejectsWith } from "../internal/rejectsWith";
import { throwsError } from "../internal/predicates";

/**
 * The GPU queue runs one request at a time, shows what it is doing, and
 * refuses a request beyond its limit instead of hiding it in a long line.
 *
 * Scenarios:
 * 1. Requests run in arrival order, one at a time, and the status names the
 *    running request, the number waiting and the last finished request.
 * 2. With the limit reached, the next request is refused at once with a
 *    reason that names the running request, and once the line drains a new
 *    request is accepted again.
 * 3. A failed request is recorded as failed and does not stop the ones
 *    behind it; a non-positive limit refuses to build.
 */
export const test_human_viewer_queue = async (): Promise<void> => {
  let clock = 0;
  const queue = createHumanViewerQueue({ limit: 2, now: () => clock });
  const order: string[] = [];
  const release: (() => void)[] = [];
  const gate = (name: string) => () =>
    new Promise<string>((resolve) => {
      order.push(`start ${name}`);
      release.push(() => resolve(name));
    });
  const settle = async (): Promise<void> => {
    for (let turn = 0; turn < 4; ++turn) await Promise.resolve();
  };
  const a = queue.run("a", gate("a"));
  const b = queue.run("b", gate("b"));
  const c = queue.run("c", gate("c"));
  await settle();
  TestValidator.equals("one running", queue.status().running, "a");
  TestValidator.equals("two waiting", queue.status().waiting, 2);
  TestValidator.predicate(
    "refused with the reason",
    await rejectsWith(() => queue.run("d", gate("d")), "behind a; retry later"),
  );
  TestValidator.predicate(
    "refusal type",
    await queue
      .run("e", gate("e"))
      .then(() => false)
      .catch((error: unknown) => error instanceof HumanViewerQueueFullError),
  );
  clock = 40;
  TestValidator.equals("running time", queue.status().runningMs, 40);
  release.shift()!();
  await a;
  await settle();
  TestValidator.equals("second runs", queue.status().running, "b");
  TestValidator.equals("last", queue.status().last, {
    label: "a",
    ms: 40,
    failed: false,
  });
  release.shift()!();
  await b;
  await settle();
  release.shift()!();
  await c;
  TestValidator.equals("order", order, ["start a", "start b", "start c"]);
  TestValidator.equals(
    "idle",
    [queue.status().running, queue.status().waiting],
    [null, 0],
  );
  TestValidator.predicate(
    "failure surfaces",
    await rejectsWith(
      () => queue.run("bad", () => Promise.reject(new Error("boom"))),
      "boom",
    ),
  );
  TestValidator.equals("failed recorded", queue.status().last?.failed, true);
  TestValidator.equals(
    "still serves",
    await queue.run("ok", () => Promise.resolve(7)),
    7,
  );
  TestValidator.predicate(
    "limit",
    throwsError(
      () => createHumanViewerQueue({ limit: 0, now: () => 0 }),
      "positive",
    ),
  );
};
