import {
  AutoMovieRenderDrawSession,
  type IAutoMovieRenderDrawPage,
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
 * @evidence contracts/development/common.md#meaningful-documentation Names the host-owned timeout, request preservation, default and accepted bounds, and browser navigation forwarding.
 * @evidence contracts/development/testing.md#behavioral-verification Calls both host-option readers on literal requests and verifies the remaining subject options, default, and explicit timer values. Drives the draw session with a recording browser page to observe its navigation timeout.
 * @evidence contracts/development/testing.md#independent-expectations Uses 120,000 ms for two minutes, the positive timer endpoints 1 and 2,147,483,647 ms, and a literal longer budget that must reach navigation unchanged.
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
  const page: IAutoMovieRenderDrawPage = {
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
    AutoMovieRenderDrawSession.open({
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
