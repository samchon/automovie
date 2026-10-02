import { TestValidator } from "@nestia/e2e";

import { createHumanViewerSpans } from "../../../scripts/human-viewer/createHumanViewerSpans";

/**
 * Page stage durations are summed by name on one monotonic clock.
 *
 * Scenarios:
 * 1. A resolving stage records its duration and returns its value; a repeated
 *    name adds to the total.
 * 2. A rejecting stage is still counted and rethrows its error.
 * 3. Reset empties the record and a snapshot is a copy that later stages do not change.
 */
export const test_human_viewer_spans = async (): Promise<void> => {
  let clock = 0;
  const spans = createHumanViewerSpans(() => clock);
  const value = await spans.measure("workerMs", async () => {
    clock += 40;
    return 7;
  });
  await spans.measure("workerMs", async () => {
    clock += 2;
  });
  TestValidator.equals("value", value, 7);
  TestValidator.equals("summed", spans.snapshot(), { workerMs: 42 });
  let message = "";
  try {
    await spans.measure("cacheWriteMs", async () => {
      clock += 5;
      throw new Error("refused");
    });
  } catch (error) {
    message = (error as Error).message;
  }
  TestValidator.equals("rethrown", message, "refused");
  const copy = spans.snapshot();
  TestValidator.equals("rejected counted", copy, { workerMs: 42, cacheWriteMs: 5 });
  await spans.measure("cacheWriteMs", async () => {
    clock += 1;
  });
  TestValidator.equals("snapshot is a copy", copy.cacheWriteMs, 5);
  spans.reset();
  TestValidator.equals("reset", spans.snapshot(), {});
};
