import { TestValidator } from "@nestia/e2e";

import { createHumanViewerWarmReadiness } from "../../../scripts/human-viewer/createHumanViewerWarmReadiness";
import { createHumanViewerQueue } from "../../../scripts/human-viewer/createHumanViewerQueue";

/**
 * Warming waits for a stable revision and never starts behind a recent request.
 *
 * Scenarios:
 * 1. A revision replaced during the stable period does not warm; only the
 *    revision that stood unchanged for the whole period does, once.
 * 2. With the stable period set, hardware alone submits nothing.
 * 3. A bulk entry does not start while a cli request arrived less than a
 *    minute ago, and starts when the minute has passed.
 */
export const test_human_viewer_warm_stable = async (): Promise<void> => {
  const submitted: string[] = [];
  const timers: (() => void)[] = [];
  const readiness = createHumanViewerWarmReadiness(
    (revision) => {
      submitted.push(revision);
    },
    {
      stableMs: 60000,
      later: (run) => {
        timers.push(run);
      },
    },
  );
  readiness.hardware();
  readiness.source("one");
  TestValidator.equals("nothing before the stable period", submitted, []);
  readiness.source("two");
  timers[0]();
  TestValidator.equals("replaced revision does not warm", submitted, []);
  timers[1]();
  TestValidator.equals("stable revision warms", submitted, ["two"]);
  timers[1]();
  TestValidator.equals("once", submitted, ["two"]);
  let clock = 0;
  const delayed: (() => void)[] = [];
  const queue = createHumanViewerQueue({
    limit: 3,
    patience: 2,
    now: () => clock,
    quietMs: 60000,
    later: (run) => {
      delayed.push(run);
    },
  });
  clock = 1000;
  await queue.run("cli", async () => "done");
  const warm = queue.run("warm", async () => "warmed", "bulk");
  clock = 60999;
  delayed.shift()!();
  TestValidator.equals("59.999 s after the request is not quiet", queue.status().waiting.bulk, 1);
  clock = 61000;
  delayed.shift()!();
  TestValidator.equals("a minute after the request warm starts", await warm, "warmed");
};
