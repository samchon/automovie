import type { AutoMovieGuidePass } from "@automovie/interface";

import { guidePassFrameName, normalizeGuidePasses } from "../guidePasses";
import type { IAutoMovieHeadlessLocator } from "./IAutoMovieHeadlessLocator";
import type { IAutoMovieHeadlessCaptureOptions } from "./IAutoMovieHeadlessCaptureOptions";
import type { IAutoMovieHeadlessCaptureSession } from "./IAutoMovieHeadlessCaptureSession";
import { AutoMovieHeadlessCaptureError } from "./AutoMovieHeadlessCaptureError";
import type { AutoMovieHeadlessCaptureErrorCode } from "./AutoMovieHeadlessCaptureErrorCode";

/**
 * Open a capture session over a Playwright-like page and return its
 * `renderVideo`-compatible `captureFrame`.
 *
 * Creation folds repeated passes, navigates to `url` once, waits for the seek
 * global, waits for the pass global when a non-beauty pass is requested, hides
 * `hideSelector`, and resolves the view locator. Each `captureFrame(t, index,
 * dir)` then calls the seek global with `t` once and, for every pass in order,
 * switches to it when passes are switched, screenshots the view, refuses an
 * empty PNG, and awaits `writeFrame` at `<dir>/<guidePassFrameName(index,
 * pass)>`. It returns the beauty path, or the first pass's path for a
 * guides-only list.
 *
 * Guarded navigation, hook, style and screenshot failures and refused pass/empty-byte inputs throw AutoMovieHeadlessCaptureError with a step code. Synchronous locator construction, writeFrame and close failures propagate unwrapped. If creation throws, the page remains the caller's; once the session returns it owns the page. Capture calls must not overlap and the caller must close after success or failure.
 *
 * @evidence contracts/common.md#principled-implementation Determinism comes from the viewer's own seek hook: the route is loaded once with its clock handed to the capturer, every frame is placed by an explicit time rather than wall-clock playback, and pass names go through `normalizeGuidePasses`, the same normalization the render planners use, so file names agree with the plans; the remaining premise is that the page hooks render synchronously, which the reference viewers' hooks do.
 * @evidence contracts/common.md#clear-and-simple-design Creation does every once-per-session step and the returned closure does only per-frame work, while page error classification sits in one local `guardCapture` helper and file naming stays with `guidePassFrameName`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The adapter has no viewer-specific branches or retries; skipping the pass hook for a beauty-only list follows from the contract that beauty needs no pass switch, not from a particular viewer.
 * @evidence contracts/common.md#meaningful-documentation The doc gives the creation steps, the per-frame steps and their order, the written paths, the returned path, the error classification including unwrapped `writeFrame` failures, and page ownership on success and failure.
 * @evidence contracts/performance.md#efficient-algorithms Creation costs one navigation, at most two hook waits and one style injection; each frame costs one seek plus, for P distinct passes, at most P pass switches, P screenshots and P writes, which is the minimum because every pass is a distinct picture; folding repeats keeps P from counting a pass twice.
 * @evidence contracts/performance.md#reuse-equivalent-work The loaded route, the hook checks, the injected style and the locator are produced once and shared by every frame, and the single seek per frame is shared by all of its passes; screenshots are never shared because each frame and pass is a different picture.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The session closures retain options, page and folded passes for as long as the session is held; close delegates page-resource release but does not clear those JavaScript references. Under the required non-overlapping captures, at most one screenshot buffer is in flight, becoming collectable after its awaited write; the writer may independently retain bytes or files. This adapter adds no timeout, cancellation or automatic failure teardown.
 * @author Samchon
 */
export const createHeadlessCaptureAdapter: (options: IAutoMovieHeadlessCaptureOptions) => Promise<IAutoMovieHeadlessCaptureSession> = async (
  options: IAutoMovieHeadlessCaptureOptions,
): Promise<IAutoMovieHeadlessCaptureSession> => {
  const seekFunction: string = options.seekFunction ?? "__afSeek";
  const passFunction: string = options.passFunction ?? "__afPass";
  const viewSelector: string = options.viewSelector ?? "#view";
  const hideSelector: string | null =
    options.hideSelector === undefined ? "#clips" : options.hideSelector;
  const passes: readonly AutoMovieGuidePass[] = foldPasses(
    options.passes ?? ["beauty"],
  );
  // A beauty-only list never touches the pass hook, so a viewer without one
  // still captures.
  const switchesPasses: boolean = passes.some(
    (pass: AutoMovieGuidePass): boolean => pass !== "beauty",
  );
  const primaryPass: AutoMovieGuidePass = passes.includes("beauty")
    ? "beauty"
    : passes[0]!;
  await guardCapture(
    "route",
    `could not load render route "${options.url}"`,
    (): Promise<unknown> =>
      options.page.goto(options.url, {
        waitUntil: options.waitUntil ?? "load",
      }),
  );
  await guardCapture(
    "seek-hook",
    `render route "${options.url}" did not expose ${seekFunction}`,
    (): Promise<unknown> =>
      options.page.waitForFunction(isPageFunction, seekFunction),
  );
  if (switchesPasses)
    await guardCapture(
      "pass-hook",
      `render route "${options.url}" did not expose ${passFunction} (required for guide passes ${passes.join(", ")})`,
      (): Promise<unknown> =>
        options.page.waitForFunction(isPageFunction, passFunction),
    );
  if (hideSelector !== null)
    await guardCapture(
      "capture",
      `could not hide render ui "${hideSelector}"`,
      (): Promise<unknown> =>
        options.page.addStyleTag({
          content: `${hideSelector}{display:none!important}`,
        }),
    );
  const view: IAutoMovieHeadlessLocator = options.page.locator(viewSelector);
  return {
    captureFrame: async (
      timeSeconds: number,
      index: number,
      dir: string,
    ): Promise<string> => {
      await guardCapture(
        "seek-hook",
        `seek hook ${seekFunction} failed at t=${timeSeconds}`,
        (): Promise<unknown> =>
          options.page.evaluate(callPageFunction, {
            name: seekFunction,
            value: timeSeconds,
          }),
      );
      const base: string = dir.replace(/[\\/]+$/, "");
      let primary: string = "";
      for (const pass of passes) {
        if (switchesPasses)
          await guardCapture(
            "pass-hook",
            `pass hook ${passFunction} failed for "${pass}" at t=${timeSeconds}`,
            (): Promise<unknown> =>
              options.page.evaluate(callPageFunction, {
                name: passFunction,
                value: pass,
              }),
          );
        const bytes: Uint8Array = await guardCapture(
          "capture",
          `could not capture ${viewSelector} (${pass}) at t=${timeSeconds}`,
          (): Promise<Uint8Array> => view.screenshot({ type: "png" }),
        );
        if (bytes.byteLength === 0)
          throw new AutoMovieHeadlessCaptureError(
            "empty-frame",
            `captured ${viewSelector} (${pass}) at t=${timeSeconds} but received zero bytes`,
          );
        const path: string = `${base}/${guidePassFrameName(index, pass)}`;
        await options.writeFrame(path, bytes, { timeSeconds, index });
        if (pass === primaryPass) primary = path;
      }
      return primary;
    },
    close: async (): Promise<void> => {
      await options.page.close();
    },
  };
};

/** Fold repeated passes and refuse an empty or unknown list as `pass-hook`. */
const foldPasses: (requested: readonly AutoMovieGuidePass[]) => readonly AutoMovieGuidePass[] = (
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

/**
 * Page-side check that a global of the given name is a function. It reads
 * only its argument because the host serializes it into the page.
 */
const isPageFunction: (name: string) => boolean = (name: string): boolean =>
  typeof (globalThis as unknown as Record<string, unknown>)[name] ===
  "function";

/**
 * Page-side call of the global `name` with `value`. It reads only its argument
 * because the host serializes it into the page.
 */
const callPageFunction: (arg: { name: string; value: unknown }) => void = (arg: { name: string; value: unknown }): void => {
  (globalThis as unknown as Record<string, (value: unknown) => void>)[
    arg.name
  ]!(arg.value);
};

/** Run one page call, rethrowing any failure as a capture error with `code`. */
const guardCapture: <T>(code: AutoMovieHeadlessCaptureErrorCode, message: string, task: () => Promise<T>) => Promise<T> = async <T>(
  code: AutoMovieHeadlessCaptureErrorCode,
  message: string,
  task: () => Promise<T>,
): Promise<T> => {
  try {
    return await task();
  } catch (error) {
    throw new AutoMovieHeadlessCaptureError(code, message, error);
  }
};
