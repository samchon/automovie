import { TestValidator } from "@nestia/e2e";

import { createHumanViewerQueue } from "../../../scripts/human-viewer/createHumanViewerQueue";
import { humanViewerQueuePosition } from "../../../scripts/human-viewer/humanViewerQueuePosition";

/**
 * Bulk work waits for a quiet period and the admission position counts the line.
 *
 * Scenarios:
 * 1. A bulk request that arrives while a foreground request has just arrived
 *    does not start; it starts when the delayed look finds five quiet seconds.
 * 2. A foreground request that arrives during the wait pushes the bulk start
 *    back, and the delayed look re-arms instead of starting it early.
 * 3. A queue without a quiet period starts bulk work at once.
 * 4. The admission position is the running request plus the waiting requests
 *    of equal or higher lanes.
 */
export const test_human_viewer_queue_quiet = async (): Promise<void> => {
  let clock = 0;
  const delayed: { run: () => void; ms: number }[] = [];
  const queue = createHumanViewerQueue({
    limit: 4,
    patience: 2,
    now: () => clock,
    quietMs: 5000,
    later: (run, ms) => {
      delayed.push({ run, ms });
    },
  });
  const order: string[] = [];
  const task = (name: string) => async (): Promise<string> => {
    order.push(name);
    return name;
  };
  clock = 1000;
  await queue.run("cli1", task("cli1"));
  const bulk = queue.run("bulk", task("bulk"), "bulk");
  TestValidator.equals("held back", [order, queue.status().waiting.bulk], [["cli1"], 1]);
  TestValidator.equals("one look scheduled for the end of the quiet", delayed.map((entry) => entry.ms), [5000]);
  clock = 3000;
  const second = queue.run("cli2", task("cli2"));
  await second;
  TestValidator.equals("foreground still goes first", order, ["cli1", "cli2"]);
  clock = 6000;
  delayed.shift()!.run();
  TestValidator.equals("re-armed, not started early", [order, delayed.map((entry) => entry.ms)], [["cli1", "cli2"], [2000]]);
  clock = 8000;
  delayed.shift()!.run();
  await bulk;
  TestValidator.equals("started after the quiet", order, ["cli1", "cli2", "bulk"]);
  const plain = createHumanViewerQueue({ limit: 2, patience: 2, now: () => 0 });
  TestValidator.equals("no quiet period", await plain.run("bulk", async () => "now", "bulk"), "now");
  const status = { waiting: { ui: 1, cli: 2, bulk: 3 }, running: "x", runningMs: 1, last: null };
  TestValidator.equals("ui position", humanViewerQueuePosition(status, "ui"), 2);
  TestValidator.equals("cli position", humanViewerQueuePosition(status, "cli"), 4);
  TestValidator.equals("bulk position", humanViewerQueuePosition(status, "bulk"), 7);
  TestValidator.equals("idle position", humanViewerQueuePosition({ ...status, running: null, waiting: { ui: 0, cli: 0, bulk: 0 } }, "cli"), 0);
};
