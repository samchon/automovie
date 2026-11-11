import type { AutoMovieGuidePass } from "@automovie/interface";
import { guidePassFrameName, normalizeGuidePasses } from "@automovie/render";

import { type IViewerCaptureSession } from "../../viewer/node/capture/IViewerCaptureSession";
import { createViewerCaptureSession } from "../../viewer/node/capture/createViewerCaptureSession";
import { AutoMovieHeadlessCaptureError } from "./AutoMovieHeadlessCaptureError";
import type { IAutoMovieHeadlessCaptureOptions } from "./IAutoMovieHeadlessCaptureOptions";
import type { IAutoMovieHeadlessCaptureSession } from "./IAutoMovieHeadlessCaptureSession";

/**
 * Open a capture session over a Playwright-like page and return its
 * `renderVideo`-compatible `captureFrame`.
 *
 * Creation folds repeated passes and opens the production's draw-only page for the film through `createViewerCaptureSession`. Each `captureFrame(t, index, dir)` then draws second `t` once per pass through the page's draw function, in order, and awaits `writeFrame` at `<dir>/<guidePassFrameName(index, pass)>`. It returns the beauty path, or the first pass's path for a guides-only list.
 *
 * Page-opening and drawing failures and a refused pass list throw AutoMovieHeadlessCaptureError with a step code; writeFrame and close failures propagate unwrapped. If creation throws, the page remains the caller's; once the session returns it owns the page. Capture calls must not overlap and the caller must close after success or failure.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Every frame is drawn by the same draw function inspection stills use, placed by an explicit time rather than wall-clock playback, and pass names go through `normalizeGuidePasses`, the same normalization the render planners use, so file names agree with the plans.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Creation does every once-per-session step and the returned closure does only per-frame work, while page error classification sits in the Viewer session and file naming stays with `guidePassFrameName`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The adapter has no film-specific branches or retries, and never screenshots the page or injects a style into it.
 * @evidence contracts/development/common.md#meaningful-documentation The doc gives the creation steps, the per-frame steps and their order, the written paths, the returned path, the error classification including unwrapped `writeFrame` failures, and page ownership on success and failure.
 * @evidence contracts/development/implementation.md#efficient-algorithms Creation costs one page load; each frame costs, for P distinct passes, P draw calls and P writes, which is the minimum because every pass is a distinct picture; folding repeats keeps P from counting a pass twice.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The loaded page and its created film are shared by every frame; pictures are never shared because each frame and pass is a different picture.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The session closures retain options, page and folded passes for as long as the session is held; close delegates page-resource release. Under the required non-overlapping captures, one frame's pictures are in flight, becoming collectable after their awaited writes; the writer may independently retain bytes or files.
 */
export const createHeadlessCaptureAdapter: (
  options: IAutoMovieHeadlessCaptureOptions,
) => Promise<IAutoMovieHeadlessCaptureSession> = async (
  options: IAutoMovieHeadlessCaptureOptions,
): Promise<IAutoMovieHeadlessCaptureSession> => {
  const passes: readonly AutoMovieGuidePass[] = foldPasses(
    options.passes ?? ["beauty"],
  );
  const primaryPass: AutoMovieGuidePass = passes.includes("beauty")
    ? "beauty"
    : passes[0]!;
  const session: IViewerCaptureSession = await createViewerCaptureSession({
    page: options.page,
    url: options.url,
    subject: options.subject,
    backend: options.backend,
    passes,
  });
  return {
    captureFrame: async (
      timeSeconds: number,
      index: number,
      dir: string,
    ): Promise<string> => {
      const base: string = dir.replace(/[\\/]+$/, "");
      let primary: string = "";
      await session.capture(
        timeSeconds,
        async (pass: AutoMovieGuidePass, bytes: Uint8Array): Promise<void> => {
          const file: string = `${base}/${guidePassFrameName(index, pass)}`;
          await options.writeFrame(file, bytes, { timeSeconds, index });
          if (pass === primaryPass) primary = file;
        },
      );
      return primary;
    },
    close: (): Promise<void> => session.close(),
  };
};

/** Fold repeated passes and refuse an empty or unknown list as `pass-hook`. */
const foldPasses: (
  requested: readonly AutoMovieGuidePass[],
) => readonly AutoMovieGuidePass[] = (
  requested: readonly AutoMovieGuidePass[],
): readonly AutoMovieGuidePass[] => {
  let passes: AutoMovieGuidePass[];
  try {
    passes = normalizeGuidePasses(requested);
  } catch (error) {
    throw new AutoMovieHeadlessCaptureError(
      "pass-hook",
      `capture passes are invalid: ${(error as Error).message}`,
      error,
    );
  }
  if (passes.length === 0)
    throw new AutoMovieHeadlessCaptureError(
      "pass-hook",
      "capture passes must contain at least one guide pass",
    );
  return passes;
};
