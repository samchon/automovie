import {
  AutoMovieDrawSession,
  type IAutoMovieDrawPage,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliCapture, AutoMovieCliRender } from "automovie";
import assert from "node:assert/strict";

/**
 * Capture and video rendering consume their draw-session budget before parsing
 * the picture request, so expensive subject creation can receive a budget
 * appropriate to the subject.
 *
 * Scenarios:
 *
 * 1. Both commands take timeout-ms out of the request and preserve subject.
 * 2. Both keep the two-minute default, preserve the minimum and maximum timer
 *    delays, and accept a longer explicit budget.
 * 3. The draw session passes that budget to the browser when loading the page.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls both public host-option readers and checks their actual remaining requests; leaving the host budget for the picture grammar fails.
 * @evidence contracts/development/testing.md#independent-expectations A page-call time budget belongs to the host; 120000 preserves its two-minute default and Node's documented positive timer range ends at 2147483647 milliseconds. Expectations are prescribed inputs, not generated output.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks both commands, absence against an explicit longer budget and both timer bounds; draw-session tests own expiration and release.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test discovered as test_cli_capture_timeout; it starts no server, process or browser.
 * @evidence contracts/development/common.md#meaningful-documentation States the host/request boundary and the two numbered scenarios.
 */
export async function test_cli_capture_timeout(): Promise<void> {
  // 1. A slow subject's host budget must not reach the picture grammar.
  for (const read of [
    AutoMovieCliCapture.readHostOptions,
    AutoMovieCliRender.readOptions,
  ]) {
    const options: ReturnType<typeof read> = read(
      new Map([
        ["module", "src/subjects.ts"],
        ["subject", "person"],
        ["timeout-ms", "600000"],
      ]),
    );
    TestValidator.equals(
      "the timeout belongs to the host",
      [...options.request],
      [["subject", "person"]],
    );
    TestValidator.equals(
      "the requested budget is preserved",
      options.timeout,
      600000,
    );

    // 2. The default and both positive timer boundaries are deliberate.
    TestValidator.equals(
      "the default remains two minutes",
      read(new Map([["module", "src/subjects.ts"]])).timeout,
      120000,
    );
    for (const timeout of [1, 2147483647])
      TestValidator.equals(
        "a supported timer boundary is preserved",
        read(
          new Map([
            ["module", "src/subjects.ts"],
            ["timeout-ms", String(timeout)],
          ]),
        ).timeout,
        timeout,
      );
  }

  const timeout: number = 600_000;
  const navigationError: Error = new Error("navigation reached its deadline");
  let navigationTimeout: number | undefined;
  const page: IAutoMovieDrawPage = {
    addInitScript: async (): Promise<void> => {},
    goto: async (
      _url: string,
      options: { waitUntil: "load"; timeout?: number },
    ): Promise<never> => {
      navigationTimeout = options.timeout;
      throw navigationError;
    },
    waitForFunction: async (): Promise<never> => {
      throw new Error("the page did not finish navigation");
    },
    evaluate: async (): Promise<never> => {
      throw new Error("the page did not install its draw function");
    },
    close: async (): Promise<void> => {},
  };
  await assert.rejects(
    AutoMovieDrawSession.open({
      page,
      url: "http://127.0.0.1/index.html",
      props: { subject: "person", props: null },
      backend: "test",
      timeout,
    }),
    (error: unknown): boolean => error === navigationError,
  );
  assert.equal(navigationTimeout, timeout);
}
