import type { IAutoMovieRenderSpec } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { renderViewerVideoSession } from "../../../../packages/template/scaffold/production/src/executable/render/node/renderViewerVideoSession";

/**
 * A transferred capture session closes once across success and every effect failure.
 *
 * Scenarios:
 * 1. Three exact samples finish before one encode and one close.
 * 2. Capture and encode failures preserve their actual causes and still close.
 * 3. Progress cancellation prevents the next capture and encoding.
 * 4. An operation plus cleanup failure retains both causes in order.
 * 5. Preparation runs once before frame zero; failure or cancellation captures nothing.
 * 6. Omitted preparation preserves the existing capture order; prior cancellation performs no work.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the actual session coordinator through its supported preparation/capture/encode ports and checks full effect ordering, exact sample timestamps, release count and original failure identities. Failed or cancelled preparation prevents every capture and encode.
 * @evidence contracts/development/testing.md#independent-expectations A one-second 3-fps half-open clock gives literal times 0, 1/3 and 2/3; ownership requires exactly one close after successful or failed use and no encoding after capture cancellation.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers optional preparation, preparation failure/cancellation, prior cancellation, success, capture failure, encode failure, progress cancellation and paired operation/close failure. Planning tests own numeric admission; actual browser and FFmpeg behavior require consumer validation.
 * @evidence contracts/development/testing.md#execution-ownership Uses in-memory implementations of the owned session and encoder ports; no process, browser, GPU, filesystem or global replacement runs.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Three exact samples finish before one encode and one close.).
 */
export async function test_viewer_video_session(): Promise<void> {
  const spec: IAutoMovieRenderSpec = {
    target: "test",
    frameFormat: { width: 640, height: 480, fps: 3 },
    toneMapping: "none",
    codec: "h264",
    pixelFormat: "yuv420p",
    crf: 18,
  };
  for (const mode of [
    "success",
    "capture",
    "encode",
    "abort",
    "cleanup",
    "prepare",
    "prepare-abort",
    "no-prepare",
    "pre-abort",
  ] as const) {
    const events: string[] = [];
    const times: number[] = [];
    const operation: Error = new Error("operation cause");
    const cleanup: Error = new Error("cleanup cause");
    const controller: AbortController = new AbortController();
    if (mode === "pre-abort") controller.abort(operation);
    let caught: unknown;
    try {
      await renderViewerVideoSession({
        spec,
        durationSeconds: 1,
        frameDir: "/frames",
        outputPath: "/movie.mp4",
        signal: controller.signal,
        prepare:
          mode === "no-prepare"
            ? undefined
            : async (): Promise<void> => {
                events.push("prepare");
                if (mode === "prepare") throw operation;
                if (mode === "prepare-abort") controller.abort(operation);
              },
        session: {
          captureFrame: async (
            seconds: number,
            index: number,
          ): Promise<string> => {
            events.push(`capture ${index}`);
            times.push(seconds);
            if ((mode === "capture" || mode === "cleanup") && index === 1)
              throw operation;
            return `/frames/frame_${index}.png`;
          },
          close: async (): Promise<void> => {
            events.push("close");
            if (mode === "cleanup") throw cleanup;
          },
        },
        encode: async (): Promise<string> => {
          events.push("encode");
          if (mode === "encode") throw operation;
          return "/movie.mp4";
        },
        onFrame: (index: number): void => {
          if (mode === "abort" && index === 0) controller.abort(operation);
        },
      });
    } catch (error) {
      caught = error;
    }
    if (mode === "success" || mode === "no-prepare") {
      TestValidator.equals("ordered successful effects", events, [
        ...(mode === "success" ? ["prepare"] : []),
        "capture 0",
        "capture 1",
        "capture 2",
        "encode",
        "close",
      ]);
      TestValidator.predicate(
        "all exact half-open times",
        times.length === 3 &&
          times[0] === 0 &&
          times[1] === 1 / 3 &&
          times[2] === 2 / 3,
      );
      TestValidator.equals(
        "successful result did not throw",
        caught,
        undefined,
      );
    } else if (mode === "cleanup") {
      TestValidator.predicate(
        "both failure causes retained",
        caught instanceof AggregateError &&
          caught.errors[0] === operation &&
          caught.errors[1] === cleanup,
      );
      TestValidator.equals("cleanup attempted once", events, [
        "prepare",
        "capture 0",
        "capture 1",
        "close",
      ]);
    } else {
      TestValidator.predicate(`${mode} preserves cause`, caught === operation);
      TestValidator.equals(
        `${mode} effect boundary`,
        events,
        mode === "pre-abort"
          ? ["close"]
          : mode === "prepare" || mode === "prepare-abort"
            ? ["prepare", "close"]
            : mode === "capture"
              ? ["prepare", "capture 0", "capture 1", "close"]
              : mode === "abort"
                ? ["prepare", "capture 0", "close"]
                : [
                    "prepare",
                    "capture 0",
                    "capture 1",
                    "capture 2",
                    "encode",
                    "close",
                  ],
      );
    }
  }
}
