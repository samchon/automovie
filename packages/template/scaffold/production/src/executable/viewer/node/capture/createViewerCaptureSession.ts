import type { AutoMovieGuidePass } from "@automovie/interface";
import {
  AutoMovieDrawSession,
  type IAutoMovieRasterImage,
  encodeAutoMovieRasterPng,
} from "@automovie/render";

import { AutoMovieHeadlessCaptureError } from "./AutoMovieHeadlessCaptureError.js";
import type { IViewerCaptureOptions } from "./IViewerCaptureOptions.js";
import type { IViewerCaptureSession } from "./IViewerCaptureSession.js";

/**
 * Open the production's draw-only page for one film and draw explicitly chosen seconds through its draw function, one call per pass, never screenshotting the page or injecting a style into it. Passes must already be validated, nonempty and deduplicated by the caller.
 *
 * Creation injects the film's name before the page loads, waits for the draw function and describes the film; a failure there is a `route` error and leaves the page with the caller. A returned session owns the page until close. Each capture draws every pass of the second through the film's own camera at its delivery raster, encodes each picture as PNG and awaits the writer in pass order; a draw failure is a `capture` error, and writer and close failures propagate unchanged.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The render package's draw session calls the same draw function every capture uses, so a delivered frame and an inspection still are drawn by the same code; PNG encoding is the render package's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Page lifecycle and pixel transport live here while scheduling, file paths and encoding into video remain with consumers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts There is no selector, hook, screenshot or injected style: the page has no interface to hide.
 * @evidence contracts/development/common.md#meaningful-documentation States creation steps and their failures, what a capture draws and writes, and ownership.
 * @evidence contracts/development/implementation.md#efficient-algorithms Creation loads the page once; each capture makes one draw call, one PNG encoding and one awaited write per pass, O(P) page calls.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The loaded page and its created film are shared across frames; distinct frames and effectful writes are never cached.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One caller-supplied page transfers on successful creation and closes explicitly; non-overlapping calls retain one frame's pictures plus whatever the writer retains.
 */
export const createViewerCaptureSession: (
  options: IViewerCaptureOptions,
) => Promise<IViewerCaptureSession> = async (
  options: IViewerCaptureOptions,
): Promise<IViewerCaptureSession> => {
  let session: AutoMovieDrawSession;
  try {
    session = await AutoMovieDrawSession.open({
      page: options.page,
      url: options.url,
      props: { subject: options.subject, props: null },
      backend: options.backend,
      timeout: options.timeout ?? 240000,
    });
  } catch (error) {
    throw new AutoMovieHeadlessCaptureError(
      "route",
      `could not open the draw page "${options.url}" for ${options.subject}`,
      error,
    );
  }
  return {
    capture: async (
      seconds: number,
      write: (pass: AutoMovieGuidePass, bytes: Uint8Array) => Promise<void>,
    ): Promise<void> => {
      let pictures: { pass: string; picture: IAutoMovieRasterImage }[];
      try {
        pictures = await session.frame(seconds, options.passes);
      } catch (error) {
        throw new AutoMovieHeadlessCaptureError(
          "capture",
          `could not draw ${options.subject} at t=${seconds}`,
          error,
        );
      }
      for (const [index, { picture }] of pictures.entries())
        await write(options.passes[index]!, await encodeAutoMovieRasterPng(picture));
    },
    close: (): Promise<void> => session.close(),
  };
};
