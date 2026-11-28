import { AutoMovieCliReview } from "automovie";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

/**
 * An inspector script failure before Play is available preserves its cause
 * and closes the browser immediately; a later error remains playback feedback.
 *
 * Scenarios:
 *
 * 1. Navigation emits an uncaught script error and the controls never appear.
 *    The operation rejects with that exact cause and closes its browser,
 *    without waiting for the control timeout.
 * 2. Controls are ready and pressing Play emits an error. The recording still
 *    returns its video and that error, closing both context and browser.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes how an uncaught error during navigation and an error during playback affect recording output and browser disposal.
 * @evidence contracts/development/testing.md#behavioral-verification Drives the recording host with in-memory navigation and Play event sources. Checks startup rejection and its original cause, verifies playback error and video output, and counts context and browser closures.
 * @evidence contracts/development/testing.md#independent-expectations Uses the supplied Error object as the cause oracle. The playback fixture independently names `recorded.webm`, its exact error text and one closure for each owned resource.
 */
export async function test_cli_playback_startup(): Promise<void> {
  const out: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-playback-"),
  );
  try {
    for (const phase of ["startup", "playback"] as const) {
      const original: Error = new Error(`${phase} script failed`);
      const listeners: ((error: Error) => void)[] = [];
      let browserClosed: number = 0;
      let contextClosed: number = 0;
      const emit = (): void => {
        for (const listener of listeners) listener(original);
      };
      const locator = {
        first: () => locator,
        waitFor: async (): Promise<void> => {
          if (phase === "startup") await new Promise<never>(() => {});
        },
        click: async (): Promise<void> => {
          emit();
        },
        innerText: async (): Promise<string> => "0.00 / 1.00 s",
      };
      const page = {
        on: (_event: "pageerror", listener: (error: Error) => void): void => {
          listeners.push(listener);
        },
        goto: async (): Promise<void> => {
          if (phase === "startup") emit();
        },
        getByRole: () => locator,
        locator: () => locator,
        waitForTimeout: async (): Promise<void> => {},
        video: () => ({ path: async (): Promise<string> => "recorded.webm" }),
      };
      const chromium = {
        launch: async () => ({
          newContext: async () => ({
            newPage: async () => page,
            close: async (): Promise<void> => {
              contextClosed++;
            },
          }),
          close: async (): Promise<void> => {
            browserClosed++;
          },
        }),
      };
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const recording = Promise.race([
          AutoMovieCliReview.recordPlayback({
            chromium,
            url: "http://127.0.0.1/",
            seconds: 0,
            out,
            env: {},
          }),
          new Promise<never>((_resolve, reject): void => {
            timer = setTimeout((): void => {
              reject(
                new Error("Startup error was hidden behind a control wait"),
              );
            }, 1_000);
          }),
        ]);
        if (phase === "startup")
          await assert.rejects(
            recording,
            (error: unknown): boolean =>
              error instanceof Error && error.cause === original,
          );
        else {
          const report = await recording;
          assert.equal(report.video, "recorded.webm");
          assert.deepEqual(report.errors, [original.message]);
          assert.equal(contextClosed, 1);
        }
        assert.equal(browserClosed, 1);
      } finally {
        clearTimeout(timer);
      }
    }
  } finally {
    await fs.rmdir(out);
  }
}
