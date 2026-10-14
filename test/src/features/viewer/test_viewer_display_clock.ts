import { TestValidator } from "@nestia/e2e";

import { createViewerDisplayClock } from "../../../../packages/viewer/src/createViewerDisplayClock";
import { nclose } from "../internal/predicates";

/**
 * Completed time follows a real synchronous producer, rather than an idle RAF.
 * Scenarios:
 * 1. Initial zero, an idle request, scoped completion and manual guide redraw.
 * 2. Explicit seek time overrides its surrounding request, including zero.
 * 3. Nested production restores its enclosing request on success or refusal.
 * 4. Invalid seconds refuse before production/state mutation; zero is valid.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the production clock directly and asserts completed seconds, callback admission and request restoration; idle requests cannot advance displayed time and producer failures must retain the enclosing scope.
 * @evidence contracts/testing.md#independent-expectations Authored seconds and finite nonnegative admission define the oracle independently of returned state. Exact scalar comparisons are appropriate because the clock assigns timestamps without numerical integration; no async producer timing is measured.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts requested versus completed time, explicit zero versus inherited time, nested success versus refusal, and each nonfinite or negative input against the supported zero boundary. Renderer completion and asynchronous timestamp delivery belong to consumers.
 * @evidence contracts/testing.md#execution-ownership The discoverable named unit invokes the portable synchronous coordinator through its producer callback, with no timer, browser or renderer. All cases execute in this entry and do not register a second harness.
 */
export function test_viewer_display_clock(): void {
  const clock: ReturnType<typeof createViewerDisplayClock> =
    createViewerDisplayClock();
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
  for (const seconds of [NaN, Infinity, -Infinity, -1]) {
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
