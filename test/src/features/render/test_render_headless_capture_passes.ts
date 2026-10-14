import { TestValidator } from "@nestia/e2e";
import { type Context, createContext } from "node:vm";

import { AutoMovieHeadlessCaptureError } from "@automovie/render";
import { IAutoMovieHeadlessCaptureOptions } from "@automovie/render";
import { IAutoMovieHeadlessCaptureSession } from "@automovie/render";
import { IAutoMovieHeadlessLocator } from "@automovie/render";
import { IAutoMovieHeadlessPage } from "@automovie/render";
import { createHeadlessCaptureAdapter } from "@automovie/render";
import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";
import { runHeadlessPageCallback } from "../internal/runHeadlessPageCallback";

class FakeLocator implements IAutoMovieHeadlessLocator {
  public async screenshot(): Promise<Uint8Array> {
    return new Uint8Array([1, 2, 3]);
  }
}

class FakePage implements IAutoMovieHeadlessPage {
  public constructor(public context: Context = createContext()) {}
  public readonly waited: unknown[] = [];

  public async goto(): Promise<void> {}

  public async waitForFunction<T>(
    predicate: (arg: T) => unknown,
    arg: T,
  ): Promise<void> {
    this.waited.push(arg);
    if (!runHeadlessPageCallback(this.context, predicate, arg))
      throw new Error("predicate false");
  }

  public async addStyleTag(): Promise<void> {}

  public async evaluate<T>(task: (arg: T) => unknown, arg: T): Promise<void> {
    runHeadlessPageCallback(this.context, task, arg);
  }

  public locator(): IAutoMovieHeadlessLocator {
    return new FakeLocator();
  }

  public async close(): Promise<void> {}
}

/** Supply only this case's page context; Node globals are never installed or restored. */
const withHooks: <T>(
  hooks: Record<string, unknown>,
  task: (context: Context) => Promise<T>,
) => Promise<T> = async <T>(
  hooks: Record<string, unknown>,
  task: (context: Context) => Promise<T>,
): Promise<T> => task(createContext(hooks));

const open: (
  page: FakePage,
  options: Partial<IAutoMovieHeadlessCaptureOptions>,
  writes: string[],
) => Promise<IAutoMovieHeadlessCaptureSession> = (
  page: FakePage,
  options: Partial<IAutoMovieHeadlessCaptureOptions>,
  writes: string[],
): Promise<IAutoMovieHeadlessCaptureSession> =>
  createHeadlessCaptureAdapter({
    page,
    url: "http://localhost:5173/stickman.html?cap=1",
    writeFrame: async (path: string): Promise<void> => {
      writes.push(path);
    },
    ...options,
  });

const codeOf: (task: () => Promise<unknown>) => Promise<string | null> = async (
  task: () => Promise<unknown>,
): Promise<string | null> => {
  try {
    await task();
    return null;
  } catch (error: unknown) {
    return error instanceof AutoMovieHeadlessCaptureError ? error.code : null;
  }
};

/**
 * Multi-pass adapter calls retain one seek, ordered page hooks and pass-tagged writer paths; supplied capture bytes are not rendered guide images.
 *
 * Scenarios:
 *
 * 1. `passes: ["beauty", "depth", "pose"]` seeks once, switches passes in order, writes the plain beauty name plus the two pass-tagged names, and returns the beauty path (the frame renderVideo encodes).
 * 2. A guides-only capture (`["depth"]`) returns its first pass path instead.
 * 3. Legacy: omitting `passes` never waits for nor calls the pass hook. A viewer without `__afPass` still produces the expected recorded path; an explicit `["beauty"]` behaves the same in this supplied page seam.
 * 4. Guide passes without a page `__afPass` fail with the `pass-hook` code; a hook that throws mid-capture also reports `pass-hook`; an empty pass list is refused at creation.
 * 5. A repeated pass folds to its first position: `["depth", "beauty", "depth"]` switches and writes each distinct pass once per frame instead of capturing and overwriting the depth file twice.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs real capture orchestration against the existing page seam, checking one seek, ordered pass calls, pass-tagged writer paths, primary selection, duplicate folding and pass-hook refusal.
 * @evidence contracts/testing.md#independent-expectations The authored beauty/depth/pose order and documented naming rule determine expected paths and switches; isolated page contexts execute the actual callbacks. The fixed supplied capture bytes and call records do not certify guide images or historical byte identity.
 * @evidence contracts/testing.md#distinguishing-cases Multi-pass, guide-only, omitted or explicit beauty, absent and throwing pass hooks, empty lists and duplicate depth preserve the original branches; route and screenshot errors belong to the companion capture test.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_headless_capture_passes owns its cases. Portable callback and adapter execution through the existing FakePage; Node globals are untouched and no real page or rendering host is installed.
 */
export async function test_render_headless_capture_passes(): Promise<void> {
  // 1. multi-pass: one seek, ordered pass switches, tagged writes.
  {
    const page: FakePage = new FakePage();
    const writes: string[] = [];
    const seeks: number[] = [];
    const passes: string[] = [];
    await withHooks(
      {
        __afSeek: (t: number): number => seeks.push(t),
        __afPass: (pass: string): number => passes.push(pass),
      },
      async (context: Context): Promise<void> => {
        page.context = context;
        const session: IAutoMovieHeadlessCaptureSession = await open(
          page,
          { passes: ["beauty", "depth", "pose"] },
          writes,
        );
        const path: string = await session.captureFrame(0.5, 2, "out/frames/");
        await session.close();
        TestValidator.equals(
          "the beauty path is the frame's primary",
          path,
          "out/frames/frame_00002.png",
        );
      },
    );
    TestValidator.predicate(
      "one seek per frame",
      filmEffectValuesClose(seeks, [0.5]),
    );
    TestValidator.equals("passes switch in order", passes, [
      "beauty",
      "depth",
      "pose",
    ]);
    TestValidator.equals("pass-tagged files written", writes, [
      "out/frames/frame_00002.png",
      "out/frames/frame_00002.depth.png",
      "out/frames/frame_00002.pose.png",
    ]);
  }

  // 2. guides-only returns the first pass path.
  {
    const writes: string[] = [];
    await withHooks(
      {
        __afSeek: (): undefined => undefined,
        __afPass: (): undefined => undefined,
      },
      async (context: Context): Promise<void> => {
        const session: IAutoMovieHeadlessCaptureSession = await open(
          new FakePage(context),
          { passes: ["depth"] },
          writes,
        );
        TestValidator.equals(
          "a guides-only capture returns its first pass",
          await session.captureFrame(0, 0, "out"),
          "out/frame_00000.depth.png",
        );
      },
    );
  }

  // 3. legacy: no passes option (and explicit beauty) never touch __afPass.
  for (const options of [
    {},
    { passes: ["beauty"] as IAutoMovieHeadlessCaptureOptions["passes"] },
  ]) {
    const writes: string[] = [];
    const passes: string[] = [];
    await withHooks(
      {
        __afSeek: (): undefined => undefined,
        __afPass: (pass: string): number => passes.push(pass),
      },
      async (context: Context): Promise<void> => {
        const session: IAutoMovieHeadlessCaptureSession = await open(
          new FakePage(context),
          options,
          writes,
        );
        TestValidator.equals(
          "legacy beauty path unchanged",
          await session.captureFrame(0, 3, "out"),
          "out/frame_00003.png",
        );
      },
    );
    TestValidator.equals("the pass hook is never called", passes, []);
    TestValidator.equals("only the plain frame is written", writes, [
      "out/frame_00003.png",
    ]);
  }

  // 4. failure shapes.
  TestValidator.equals(
    "guide passes without a page pass hook fail as pass-hook",
    await withHooks(
      { __afSeek: (): undefined => undefined },
      (context: Context): Promise<string | null> =>
        codeOf(
          (): Promise<IAutoMovieHeadlessCaptureSession> =>
            open(new FakePage(context), { passes: ["depth"] }, []),
        ),
    ),
    "pass-hook",
  );
  TestValidator.equals(
    "a throwing pass hook reports pass-hook",
    await withHooks(
      {
        __afSeek: (): undefined => undefined,
        __afPass: (): never => {
          throw new Error("boom");
        },
      },
      async (context: Context): Promise<string | null> => {
        const session: IAutoMovieHeadlessCaptureSession = await open(
          new FakePage(context),
          { passes: ["depth"] },
          [],
        );
        return codeOf((): Promise<string> => session.captureFrame(0, 0, "out"));
      },
    ),
    "pass-hook",
  );
  TestValidator.equals(
    "an empty pass list is refused at creation",
    await codeOf(
      (): Promise<IAutoMovieHeadlessCaptureSession> =>
        open(new FakePage(), { passes: [] }, []),
    ),
    "pass-hook",
  );

  // 5. repeated passes fold to their first position.
  {
    const writes: string[] = [];
    const passes: string[] = [];
    await withHooks(
      {
        __afSeek: (): undefined => undefined,
        __afPass: (pass: string): number => passes.push(pass),
      },
      async (context: Context): Promise<void> => {
        const session: IAutoMovieHeadlessCaptureSession = await open(
          new FakePage(context),
          { passes: ["depth", "beauty", "depth"] },
          writes,
        );
        TestValidator.equals(
          "a folded list still returns the beauty path",
          await session.captureFrame(0, 1, "out"),
          "out/frame_00001.png",
        );
      },
    );
    TestValidator.equals("each distinct pass is switched once", passes, [
      "depth",
      "beauty",
    ]);
    TestValidator.equals("each distinct pass is written once", writes, [
      "out/frame_00001.depth.png",
      "out/frame_00001.png",
    ]);
  }
}
