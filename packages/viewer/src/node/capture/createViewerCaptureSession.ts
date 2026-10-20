import type { AutoMovieGuidePass } from "@automovie/interface";

import { AutoMovieHeadlessCaptureError } from "./AutoMovieHeadlessCaptureError.js";
import type { AutoMovieHeadlessCaptureErrorCode } from "./AutoMovieHeadlessCaptureErrorCode.js";
import type { IAutoMovieHeadlessLocator } from "./IAutoMovieHeadlessLocator.js";
import type { IViewerCaptureOptions } from "./IViewerCaptureOptions.js";
import type { IViewerCaptureSession } from "./IViewerCaptureSession.js";

/**
 * Open one page and capture explicitly sought samples through its published hooks. Passes must already be validated, nonempty and deduplicated by the caller. A hook override selects another published seek hook for an isolated sample.
 *
 * Creation failures leave the page with the caller; a returned session owns it until close. Captures must not overlap. Each pass supplies its PNG bytes to an awaited writer without retaining previous frames. Writer and close failures propagate unchanged; page failures carry a capture-step code.
 *
 * @evidence contracts/common.md#principled-implementation One explicit seek followed by ordered pass switches and screenshots observes the viewer's deterministic hooks; the caller supplies admitted pass names and owns output naming.
 * @evidence contracts/common.md#clear-and-simple-design Page lifecycle and pixel transport live here while scheduling, file paths and encoding remain with consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same hook and selector options drive every route; beauty-only capture requires no pass hook.
 * @evidence contracts/common.md#meaningful-documentation States admission premises, hook overrides, failure ownership and non-overlapping use.
 * @evidence contracts/performance.md#efficient-algorithms Initialization navigates once; each capture seeks once and performs one screenshot and awaited write per requested pass, O(P) browser calls.
 * @evidence contracts/performance.md#reuse-equivalent-work The loaded page, checked hooks and locator are shared across samples; distinct screenshots and effectful writes are never cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One caller-supplied page transfers on successful creation and closes explicitly; non-overlapping calls retain at most one screenshot buffer plus whatever the writer retains. Failed creation leaves release with the caller.
 */
export const createViewerCaptureSession: (
  options: IViewerCaptureOptions,
) => Promise<IViewerCaptureSession> = async (
  options: IViewerCaptureOptions,
): Promise<IViewerCaptureSession> => {
  const seekFunction: string = options.seekFunction ?? "__afSeek";
  const passFunction: string = options.passFunction ?? "__afPass";
  const viewSelector: string = options.viewSelector ?? "#view";
  const hideSelector: string | null =
    options.hideSelector === undefined ? "#clips" : options.hideSelector;
  const passes: readonly AutoMovieGuidePass[] = options.passes;
  // A beauty-only list never touches the pass hook, so a viewer without one
  // still captures.
  const switchesPasses: boolean = passes.some(
    (pass: AutoMovieGuidePass): boolean => pass !== "beauty",
  );
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
    capture: async (
      sample: unknown,
      write: (pass: AutoMovieGuidePass, bytes: Uint8Array) => Promise<void>,
      hook: string = seekFunction,
    ): Promise<void> => {
      await guardCapture(
        "seek-hook",
        `seek hook ${hook} failed at t=${sample}`,
        (): Promise<unknown> =>
          options.page.evaluate(callPageFunction, {
            name: hook,
            value: sample,
          }),
      );
      for (const pass of passes) {
        if (switchesPasses)
          await guardCapture(
            "pass-hook",
            `pass hook ${passFunction} failed for "${pass}" at t=${sample}`,
            (): Promise<unknown> =>
              options.page.evaluate(callPageFunction, {
                name: passFunction,
                value: pass,
              }),
          );
        const bytes: Uint8Array = await guardCapture(
          "capture",
          `could not capture ${viewSelector} (${pass}) at t=${sample}`,
          (): Promise<Uint8Array> => view.screenshot({ type: "png" }),
        );
        if (bytes.byteLength === 0)
          throw new AutoMovieHeadlessCaptureError(
            "empty-frame",
            `captured ${viewSelector} (${pass}) at t=${sample} but received zero bytes`,
          );
        await write(pass, bytes);
      }
    },
    close: async (): Promise<void> => {
      await options.page.close();
    },
  };
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
const callPageFunction: (arg: {
  name: string;
  value: unknown;
}) => void = (arg: { name: string; value: unknown }): void => {
  (globalThis as unknown as Record<string, (value: unknown) => void>)[
    arg.name
  ]!(arg.value);
};

/** Run one page call, rethrowing any failure as a capture error with `code`. */
const guardCapture: <T>(
  code: AutoMovieHeadlessCaptureErrorCode,
  message: string,
  task: () => Promise<T>,
) => Promise<T> = async <T>(
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
