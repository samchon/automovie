import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";
import { nclose } from "../internal/predicates";

const { createViewerDisplayClock } = loadSourceModule<{
  createViewerDisplayClock: () => {
    current: () => number;
    run: (seconds: number, produce: () => void) => void;
    complete: (seconds?: number) => number;
  };
}>(path.resolve(__dirname, "../../../../packages/viewer/src/createViewerDisplayClock.ts"));

/**
 * Completed time follows a real synchronous producer, rather than an idle RAF.
 * Scenarios:
 * 1. Initial zero, an idle request, scoped completion and manual guide redraw.
 * 2. Explicit seek time overrides its surrounding request, including zero.
 * 3. Nested production restores its enclosing request on success or refusal.
 * 4. Invalid seconds refuse before production/state mutation; zero is valid.
 */
export const test_viewer_display_clock = (): void => {
  const clock = createViewerDisplayClock();
  const refused = (title: string, work: () => void, expected?: Error): void => {
    let cause: unknown;
    try { work(); } catch (error) { cause = error; }
    TestValidator.predicate(title, cause instanceof Error);
    if (expected !== undefined) TestValidator.predicate(title + " preserves original failure", cause === expected);
  };
  TestValidator.equals("initial clock", clock.current(), 0);
  clock.run(10, () => {});
  TestValidator.equals("idle request preserves displayed clock", clock.current(), 0);
  clock.run(3.7, () => { TestValidator.predicate("actual producer seconds", nclose(clock.complete(), 3.7, 0)); });
  TestValidator.predicate("manual guide preserves completed seconds", nclose(clock.complete(), 3.7, 0));
  clock.run(42, () => { TestValidator.equals("explicit zero overrides request", clock.complete(0), 0); });
  TestValidator.equals("explicit zero remains displayed", clock.current(), 0);
  clock.run(8, () => {
    clock.run(4, () => { TestValidator.equals("nested producer", clock.complete(), 4); });
    TestValidator.equals("enclosing producer restored", clock.complete(), 8);
    const failure = new Error("producer refusal");
    refused("nested refusal", () => clock.run(5, () => { throw failure; }), failure);
    TestValidator.equals("enclosing request survives refusal", clock.complete(), 8);
  });
  const failure = new Error("draw refusal");
  refused("outer refusal", () => clock.run(20, () => { throw failure; }), failure);
  TestValidator.equals("refusal retains last completed time", clock.complete(), 8);
  for (const seconds of [NaN, Infinity, -Infinity, -1]) {
    let produced = false;
    refused("invalid request " + seconds, () => clock.run(seconds, () => { produced = true; }));
    TestValidator.equals("invalid request never draws", produced, false);
    refused("invalid completion " + seconds, () => { clock.complete(seconds); });
    TestValidator.equals("invalid completion preserves time", clock.current(), 8);
  }
  clock.run(0, () => { TestValidator.equals("supported boundary", clock.complete(), 0); });
  TestValidator.equals("manual explicit seek", clock.complete(12), 12);
};
