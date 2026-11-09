import type { IAutoMovieRenderSpec } from "@automovie/interface";
import {
  type IAutoMovieRenderAdapters,
  type IAutoMovieRenderResult,
  renderVideo,
} from "@automovie/render";

import type { IAutoMovieHeadlessCaptureSession } from "../headlessCapture/IAutoMovieHeadlessCaptureSession";
import { preserveCleanupFailure } from "./capture/preserveCleanupFailure";

/**
 * Prepare and consume one owned capture session, then release it on every outcome.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Optional preparation completes once before the existing renderVideo schedule serializes captures and encoding; finally awaits session release, preserving the operation and release causes when both fail. Cancellation is checked before and after preparation and at every frame/encode boundary.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This portable coordinator owns transferred session lifetime; browser creation and frame-byte writing stay with the Node runner and Viewer adapter.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Supplied capture and encode ports execute directly, with no substituted timestamps, retries or swallowed cleanup failure.
 * @evidence contracts/development/common.md#meaningful-documentation States session ownership transfer, preparation order, sequential schedule, cancellation boundaries and failure propagation. Preparation rejection or cancellation produces no capture or encoding.
 * @evidence contracts/development/implementation.md#efficient-algorithms Delegates O(F) scheduling and metadata to renderVideo, adding fixed checks and one duration measurement per frame.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One transferred session serves every distinct frame once; effectful capture and encoding are not cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Exactly one transferred session closes once on success, capture/encode/progress failure or cancellation; no native browser is acquired here.
 */
export async function renderViewerVideoSession(options: {
  session: IAutoMovieHeadlessCaptureSession;
  spec: IAutoMovieRenderSpec;
  durationSeconds: number;
  frameDir: string;
  outputPath: string;
  encode: IAutoMovieRenderAdapters["encode"];
  prepare?: () => Promise<void>;
  signal?: AbortSignal;
  onFrame?: (index: number, seconds: number, captureMs: number) => void;
}): Promise<IAutoMovieRenderResult> {
  let failure: { error: unknown } | undefined;
  try {
    options.signal?.throwIfAborted();
    await options.prepare?.();
    options.signal?.throwIfAborted();
    return await renderVideo(
      options.spec,
      options.durationSeconds,
      options.frameDir,
      options.outputPath,
      {
        captureFrame: async (
          seconds: number,
          index: number,
          directory: string,
        ): Promise<string> => {
          options.signal?.throwIfAborted();
          const begun: number = performance.now();
          const file: string = await options.session.captureFrame(
            seconds,
            index,
            directory,
          );
          options.onFrame?.(index, seconds, performance.now() - begun);
          return file;
        },
        encode: async (args: string[], outputPath: string): Promise<string> => {
          options.signal?.throwIfAborted();
          return options.encode(args, outputPath);
        },
      },
    );
  } catch (error) {
    failure = { error };
    throw error;
  } finally {
    await preserveCleanupFailure(
      failure,
      "viewer video session",
      (): Promise<void> => options.session.close(),
    );
  }
}
