import { TestValidator } from "@nestia/e2e";

import {
  isHumanViewerGenerationChange,
  retryAcrossHumanViewerGeneration,
} from "../../../scripts/human-viewer/retryAcrossHumanViewerGeneration";

/**
 * A request that meets a source rebuild runs again on the settled generation.
 *
 * Scenarios:
 * 1. Each generation-change refusal, as the page reports it with its prefix,
 *    is recognised; an unrelated error is not.
 * 2. A first attempt that fails with a change succeeds on the second after one
 *    settle, and returns the second attempt's value.
 * 3. A build failure is thrown at once with no settle.
 * 4. A source that keeps changing ends in the last refusal after the bound.
 */
export const test_human_viewer_generation_retry = async (): Promise<void> => {
  for (const text of [
    "page.evaluate: Error: The source generation was replaced during display\n at x",
    "Source changed during capture; the mixed revision was discarded",
    "Source changed during request",
    "Source changed during sheet capture",
    "The source revision has not finished loading",
  ])
    TestValidator.predicate(text, isHumanViewerGenerationChange(new Error(text)));
  TestValidator.predicate("unrelated", !isHumanViewerGenerationChange(new Error("Invalid pitch")));
  TestValidator.predicate("non error", !isHumanViewerGenerationChange("Invalid pitch"));
  TestValidator.predicate("string cause", isHumanViewerGenerationChange("Source changed during request"));
  let settles = 0;
  const settle = async (): Promise<void> => {
    ++settles;
  };
  let calls = 0;
  const value = await retryAcrossHumanViewerGeneration(async () => {
    if (++calls === 1) throw new Error("Source changed during request");
    return "frame";
  }, { settle, attempts: 3 });
  TestValidator.equals("second attempt", [value, calls, settles], ["frame", 2, 1]);
  settles = 0;
  let message = "";
  try {
    await retryAcrossHumanViewerGeneration(async () => {
      throw new Error("Human violates an original contact floor");
    }, { settle, attempts: 3 });
  } catch (error) {
    message = (error as Error).message;
  }
  TestValidator.equals("build failure immediate", [message, settles], ["Human violates an original contact floor", 0]);
  calls = 0;
  settles = 0;
  try {
    await retryAcrossHumanViewerGeneration(async () => {
      throw new Error(`Source changed during request ${++calls}`);
    }, { settle, attempts: 3 });
  } catch (error) {
    message = (error as Error).message;
  }
  TestValidator.equals("bounded", [message, calls, settles], ["Source changed during request 3", 3, 2]);
};
