import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";
import { IAutoMovieHeadlessCaptureSession } from "../../../../packages/render/src/headlessCapture/IAutoMovieHeadlessCaptureSession";
import { AutoMovieHeadlessCaptureErrorCode } from "../../../../packages/render/src/headlessCapture/AutoMovieHeadlessCaptureErrorCode";
import { createContext, type Context } from "node:vm";
import { runHeadlessPageCallback } from "../internal/runHeadlessPageCallback";
import { AutoMovieHeadlessCaptureError } from "../../../../packages/render/src/headlessCapture/AutoMovieHeadlessCaptureError";
import { IAutoMovieHeadlessCaptureOptions } from "../../../../packages/render/src/headlessCapture/IAutoMovieHeadlessCaptureOptions";
import { IAutoMovieHeadlessLocator } from "../../../../packages/render/src/headlessCapture/IAutoMovieHeadlessLocator";
import { IAutoMovieHeadlessPage } from "../../../../packages/render/src/headlessCapture/IAutoMovieHeadlessPage";
import { createHeadlessCaptureAdapter } from "../../../../packages/render/src/headlessCapture/createHeadlessCaptureAdapter";
import { TestValidator } from "@nestia/e2e";
type Failure = "goto" | "wait" | "style" | "evaluate" | "screenshot" | null;

class FakeLocator implements IAutoMovieHeadlessLocator {
  public constructor(private readonly page: FakePage) {}

  public async screenshot(): Promise<Uint8Array> {
    if (this.page.fail === "screenshot") throw new Error("screenshot failed");
    return this.page.bytes;
  }
}

class FakePage implements IAutoMovieHeadlessPage {
  public context: Context = createContext();
  public readonly gotos: Array<{ url: string; waitUntil: string }> = [];
  public readonly styles: string[] = [];
  public readonly selectors: string[] = [];
  public readonly closed: number[] = [];
  public bytes: Uint8Array = new Uint8Array([1, 2, 3]);
  public fail: Failure = null;

  public async goto(
    url: string,
    options: { waitUntil: string },
  ): Promise<void> {
    if (this.fail === "goto") throw new Error("route failed");
    this.gotos.push({ url, waitUntil: options.waitUntil });
  }

  public async waitForFunction<T>(
    predicate: (arg: T) => unknown,
    arg: T,
  ): Promise<void> {
    if (this.fail === "wait") throw new Error("wait failed");
    if (!runHeadlessPageCallback(this.context, predicate, arg)) throw new Error("predicate false");
  }

  public async addStyleTag(options: { content: string }): Promise<void> {
    if (this.fail === "style") throw new Error("style failed");
    this.styles.push(options.content);
  }

  public async evaluate<T>(task: (arg: T) => unknown, arg: T): Promise<void> {
    if (this.fail === "evaluate") throw new Error("evaluate failed");
    runHeadlessPageCallback(this.context, task, arg);
  }

  public locator(selector: string): IAutoMovieHeadlessLocator {
    this.selectors.push(selector);
    return new FakeLocator(this);
  }

  public async close(): Promise<void> {
    this.closed.push(1);
  }
}

const withSeek: <T>(page: FakePage, name: string, seek: (time: number) => void, task: () => Promise<T>) => Promise<T> = async <T>(
  page: FakePage,
  name: string,
  seek: (time: number) => void,
  task: () => Promise<T>,
): Promise<T> => {
  page.context = createContext({ [name]: seek });
  return task();
};

const rejectsCapture: (task: () => Promise<unknown>) => Promise<AutoMovieHeadlessCaptureErrorCode | null> = async (
  task: () => Promise<unknown>,
): Promise<AutoMovieHeadlessCaptureError["code"] | null> => {
  try {
    await task();
    return null;
  } catch (error: unknown) {
    if (error instanceof AutoMovieHeadlessCaptureError) {
      TestValidator.predicate("capture error keeps source", "source" in error);
      return error.code;
    }
    throw error;
  }
};

const open: (page: FakePage, options?: Partial<IAutoMovieHeadlessCaptureOptions>) => Promise<IAutoMovieHeadlessCaptureSession> = async (
  page: FakePage,
  options: Partial<IAutoMovieHeadlessCaptureOptions> = {},
): Promise<IAutoMovieHeadlessCaptureSession> =>
  createHeadlessCaptureAdapter({
    page,
    url: "http://localhost:5173/film.html?cap=1",
    writeFrame: async (): Promise<undefined> => undefined,
    ...options,
  });

/**
 * The reusable headless capture adapter turns a Playwright-like page into the `captureFrame` half of `renderVideo`.
 *
 * Scenarios:
 *
 * 1. The page seam records one navigation request, seek-hook wait and UI-hiding style; the adapter forwards supplied capture bytes to its writer and returns the path.
 * 2. Custom selectors, seek hook, and wait condition override the defaults.
 * 3. Route, seek-hook, style, screenshot, and empty-frame failures are reported with structured error codes.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real adapter through the existing page seam and records navigation, style, selector, page-local seek, supplied bytes, writer metadata and close calls, including structured step failures.
 * @evidence contracts/testing.md#independent-expectations The declared defaults and authored custom names determine expected calls and frame_00002.png; captured bytes are the existing supplied [1,2,3], not decoded PNG evidence. Self-contained product callbacks execute in the page instance's isolated VM context instead of a patched Node global.
 * @evidence contracts/testing.md#distinguishing-cases Default/custom settings and route, missing seek, style, evaluation, screenshot and empty-byte failures preserve all existing cases. The synchronous wait seam models refusal, not a real browser timeout or polling implementation.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_headless_capture owns its cases. Portable adapter/callback semantics in the existing FakePage, with no navigation process, filesystem writer, actual screenshot, browser or GPU.
 */
export async function test_render_headless_capture(): Promise<void> {
  const page: FakePage = new FakePage();
  const writes: Array<{
    path: string;
    bytes: number[];
    timeSeconds: number;
    index: number;
  }> = [];
  const seeks: number[] = [];
  await withSeek(
    page,
    "__afSeek",
    (time: number): number => seeks.push(time),
    async (): Promise<void> => {
      const session: IAutoMovieHeadlessCaptureSession = await open(page, {
        writeFrame: async (path: string, bytes: Uint8Array<ArrayBufferLike>, metadata: { timeSeconds: number; index: number; }): Promise<void> => {
          writes.push({
            path,
            bytes: [...bytes],
            timeSeconds: metadata.timeSeconds,
            index: metadata.index,
          });
        },
      });
      const path: string = await session.captureFrame(0.5, 2, "out/frames/");
      await session.close();
      TestValidator.equals("captured path", path, "out/frames/frame_00002.png");
    },
  );
  TestValidator.equals("route loaded once", page.gotos, [
    { url: "http://localhost:5173/film.html?cap=1", waitUntil: "load" },
  ]);
  TestValidator.equals("default ui hidden", page.styles, [
    "#clips{display:none!important}",
  ]);
  TestValidator.equals("default selector", page.selectors, ["#view"]);
  TestValidator.predicate("seek called", filmEffectValuesClose(seeks, [0.5]));
  TestValidator.predicate("frame written", filmEffectValuesClose(writes, [
    {
      path: "out/frames/frame_00002.png",
      bytes: [1, 2, 3],
      timeSeconds: 0.5,
      index: 2,
    },
  ]));
  TestValidator.equals("page closed", page.closed.length, 1);

  const custom: FakePage = new FakePage();
  const customSeeks: number[] = [];
  await withSeek(
    custom,
    "seekClip",
    (time: number): number => customSeeks.push(time),
    async (): Promise<void> => {
      const session: IAutoMovieHeadlessCaptureSession = await open(custom, {
        url: "http://localhost:5173/stickman.html?cap=1",
        waitUntil: "domcontentloaded",
        seekFunction: "seekClip",
        viewSelector: "#canvas",
        hideSelector: null,
      });
      await session.captureFrame(0.25, 0, "frames");
    },
  );
  TestValidator.equals("custom route", custom.gotos, [
    {
      url: "http://localhost:5173/stickman.html?cap=1",
      waitUntil: "domcontentloaded",
    },
  ]);
  TestValidator.equals("hide disabled", custom.styles, []);
  TestValidator.equals("custom selector", custom.selectors, ["#canvas"]);
  TestValidator.predicate("custom seek", filmEffectValuesClose(customSeeks, [0.25]));

  const routeFailure: FakePage = new FakePage();
  routeFailure.fail = "goto";
  TestValidator.equals(
    "route failure code",
    await rejectsCapture((): Promise<IAutoMovieHeadlessCaptureSession> => open(routeFailure)),
    "route",
  );

  const waitFailure: FakePage = new FakePage();
  TestValidator.equals(
    "seek-hook wait failure code",
    await rejectsCapture((): Promise<IAutoMovieHeadlessCaptureSession> => open(waitFailure)),
    "seek-hook",
  );

  const styleFailure: FakePage = new FakePage();
  styleFailure.fail = "style";
  await withSeek(
    styleFailure,
    "__afSeek",
    (): undefined => undefined,
    async (): Promise<void> =>
      TestValidator.equals(
        "style failure code",
        await rejectsCapture((): Promise<IAutoMovieHeadlessCaptureSession> => open(styleFailure)),
        "capture",
      ),
  );

  const evaluateFailure: FakePage = new FakePage();
  await withSeek(
    evaluateFailure,
    "__afSeek",
    (): undefined => undefined,
    async (): Promise<void> => {
      const session: IAutoMovieHeadlessCaptureSession = await open(evaluateFailure);
      evaluateFailure.fail = "evaluate";
      TestValidator.equals(
        "seek evaluate failure code",
        await rejectsCapture((): Promise<string> => session.captureFrame(0, 0, "frames")),
        "seek-hook",
      );
    },
  );

  const screenshotFailure: FakePage = new FakePage();
  await withSeek(
    screenshotFailure,
    "__afSeek",
    (): undefined => undefined,
    async (): Promise<void> => {
      const session: IAutoMovieHeadlessCaptureSession = await open(screenshotFailure);
      screenshotFailure.fail = "screenshot";
      TestValidator.equals(
        "screenshot failure code",
        await rejectsCapture((): Promise<string> => session.captureFrame(0, 0, "frames")),
        "capture",
      );
    },
  );

  const emptyFrame: FakePage = new FakePage();
  emptyFrame.bytes = new Uint8Array([]);
  await withSeek(
    emptyFrame,
    "__afSeek",
    (): undefined => undefined,
    async (): Promise<void> => {
      const session: IAutoMovieHeadlessCaptureSession = await open(emptyFrame);
      TestValidator.equals(
        "empty frame failure code",
        await rejectsCapture((): Promise<string> => session.captureFrame(0, 0, "frames")),
        "empty-frame",
      );
    },
  );
}
