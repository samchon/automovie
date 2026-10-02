import { TestValidator } from "@nestia/e2e";

import { HumanViewerQueueFullError } from "../../../scripts/human-viewer/HumanViewerQueueFullError";
import { createHumanViewerQueue } from "../../../scripts/human-viewer/createHumanViewerQueue";
import { throwsError } from "../internal/predicates";
import { rejectsWith } from "../internal/rejectsWith";

/**
 * The GPU queue serves three lanes one request at a time, shows what it is
 * doing, and refuses a request beyond a lane's limit.
 *
 * Scenarios:
 * 1. A waiting `ui` request starts before waiting `cli` and `bulk` ones, `cli`
 *    before `bulk`, and requests of one lane in arrival order; the running
 *    request is never cut off.
 * 2. After `patience` consecutive `ui` starts a waiting `cli` request goes
 *    next, so a busy screen cannot starve scripts.
 * 3. The status names the running request, each lane's length and the last
 *    finished request; a full lane refuses at once with a reason naming the
 *    running request, while another lane still accepts.
 * 4. A failed request is recorded as failed and does not stop the ones behind
 *    it; a non-positive limit or patience refuses to build.
 */
export const test_human_viewer_queue = async (): Promise<void> => {
  let clock = 0;
  const queue = createHumanViewerQueue({
    limit: 2,
    patience: 2,
    now: () => clock,
  });
  const order: string[] = [];
  const release = new Map<string, () => void>();
  const gate = (name: string) => () =>
    new Promise<string>((resolve) => {
      order.push(name);
      release.set(name, () => resolve(name));
    });
  const finish = async (name: string, done: Promise<unknown>): Promise<void> => {
    release.get(name)!();
    await done;
  };
  const first = queue.run("first", gate("first"), "bulk");
  const bulk = queue.run("bulk", gate("bulk"), "bulk");
  const cli = queue.run("cli", gate("cli"));
  const ui1 = queue.run("ui1", gate("ui1"), "ui");
  const ui2 = queue.run("ui2", gate("ui2"), "ui");
  TestValidator.equals("running", queue.status().running, "first");
  TestValidator.equals("lanes", queue.status().waiting, { ui: 2, cli: 1, bulk: 1 });
  clock = 40;
  TestValidator.equals("running time", queue.status().runningMs, 40);
  TestValidator.predicate(
    "full lane refuses with the reason",
    await rejectsWith(
      () => queue.run("ui3", gate("ui3"), "ui"),
      "ui requests are already waiting behind first",
    ),
  );
  TestValidator.predicate(
    "refusal type",
    await queue
      .run("ui4", gate("ui4"), "ui")
      .then(() => false)
      .catch((error: unknown) => error instanceof HumanViewerQueueFullError),
  );
  await finish("first", first);
  TestValidator.equals("last", queue.status().last, {
    label: "first",
    ms: 40,
    failed: false,
  });
  await finish("ui1", ui1);
  await finish("ui2", ui2);
  // Two consecutive ui starts have passed, so the waiting cli request is next.
  await finish("cli", cli);
  await finish("bulk", bulk);
  TestValidator.equals("order", order, ["first", "ui1", "ui2", "cli", "bulk"]);
  TestValidator.equals("idle", queue.status().running, null);
  TestValidator.predicate(
    "failure surfaces",
    await rejectsWith(() => queue.run("bad", () => Promise.reject(new Error("boom"))), "boom"),
  );
  TestValidator.equals("failed recorded", queue.status().last?.failed, true);
  TestValidator.equals("still serves", await queue.run("ok", () => Promise.resolve(7)), 7);
  TestValidator.predicate(
    "limit",
    throwsError(() => createHumanViewerQueue({ limit: 0, patience: 1, now: () => 0 }), "limit"),
  );
  TestValidator.predicate(
    "patience",
    throwsError(() => createHumanViewerQueue({ limit: 1, patience: 0, now: () => 0 }), "patience"),
  );
};
