import { AutoMovieViewerDisplay } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * Completed time follows a real synchronous producer, rather than an idle RAF.
 * Scenarios:
 *
 * 1. Initial zero, an idle request, scoped completion and manual guide redraw.
 * 2. Explicit seek time overrides its surrounding request, including zero.
 * 3. Nested production restores its enclosing request on success or refusal.
 * 4. Invalid seconds refuse before production/state mutation; zero is valid.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Publishes only completed time and restores enclosing clock state through nested success and refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the display clock through an idle request, synchronous completion, manual redraw, explicit zero and nested or invalid requests.
 * @evidence contracts/development/testing.md#independent-expectations Literal seconds distinguish the requested and completed clocks. A refusal retains the previous completion and nested calls must return to the known enclosing time.
 */
export function test_viewer_root_create_display_clock(): void {
  const clock: AutoMovieViewerDisplay.IClock =
    AutoMovieViewerDisplay.createClock();
  const refused: (title: string, work: () => void, expected?: Error) => void = (
    title: string,
    work: () => void,
    expected?: Error,
  ): void => {
    let cause: unknown;
    try {
      work();
    } catch (error) {
      cause = error;
    }
    TestValidator.predicate(title, cause instanceof Error);
    if (expected !== undefined)
      TestValidator.predicate(
        title + " preserves original failure",
        cause === expected,
      );
  };
  TestValidator.equals("initial clock", clock.current(), 0);
  clock.run(10, (): void => {});
  TestValidator.equals(
    "idle request preserves displayed clock",
    clock.current(),
    0,
  );
  clock.run(3.7, (): void => {
    TestValidator.predicate(
      "actual producer seconds",
      nclose(clock.complete(), 3.7, 0),
    );
  });
  TestValidator.predicate(
    "manual guide preserves completed seconds",
    nclose(clock.complete(), 3.7, 0),
  );
  clock.run(42, (): void => {
    TestValidator.equals(
      "explicit zero overrides request",
      clock.complete(0),
      0,
    );
  });
  TestValidator.equals("explicit zero remains displayed", clock.current(), 0);
  clock.run(8, (): void => {
    clock.run(4, (): void => {
      TestValidator.equals("nested producer", clock.complete(), 4);
    });
    TestValidator.equals("enclosing producer restored", clock.complete(), 8);
    const failure: Error = new Error("producer refusal");
    refused(
      "nested refusal",
      (): void =>
        clock.run(5, (): never => {
          throw failure;
        }),
      failure,
    );
    TestValidator.equals(
      "enclosing request survives refusal",
      clock.complete(),
      8,
    );
  });
  const failure: Error = new Error("draw refusal");
  refused(
    "outer refusal",
    (): void =>
      clock.run(20, (): never => {
        throw failure;
      }),
    failure,
  );
  TestValidator.equals(
    "refusal retains last completed time",
    clock.complete(),
    8,
  );
  for (const seconds of [-1]) {
    let produced: boolean = false;
    refused("invalid request " + seconds, (): void =>
      clock.run(seconds, (): void => {
        produced = true;
      }),
    );
    TestValidator.equals("invalid request never draws", produced, false);
    refused("invalid completion " + seconds, (): void => {
      clock.complete(seconds);
    });
    TestValidator.equals(
      "invalid completion preserves time",
      clock.current(),
      8,
    );
  }
  clock.run(0, (): void => {
    TestValidator.equals("supported boundary", clock.complete(), 0);
  });
  TestValidator.equals("manual explicit seek", clock.complete(12), 12);
}
