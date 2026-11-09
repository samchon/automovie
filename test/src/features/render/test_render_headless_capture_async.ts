import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { type Context, createContext } from "node:vm";

import { AutoMovieHeadlessCaptureError } from "../../../../packages/template/scaffold/production/src/executable/viewer/node/capture/AutoMovieHeadlessCaptureError";
import { type IAutoMovieHeadlessLocator } from "../../../../packages/template/scaffold/production/src/executable/viewer/node/capture/IAutoMovieHeadlessLocator";
import { type IAutoMovieHeadlessPage } from "../../../../packages/template/scaffold/production/src/executable/viewer/node/capture/IAutoMovieHeadlessPage";
import { type IViewerCaptureSession } from "../../../../packages/template/scaffold/production/src/executable/viewer/node/capture/IViewerCaptureSession";
import { createViewerCaptureSession } from "../../../../packages/template/scaffold/production/src/executable/viewer/node/capture/createViewerCaptureSession";
import { runHeadlessPageCallback } from "../internal/runHeadlessPageCallback";

/** A controllable hook settlement, without timers or a browser process. */
function deferred(): {
  promise: Promise<undefined>;
  resolve: () => void;
  reject: (reason: unknown) => void;
} {
  let complete: () => void = (): never => {
    throw new Error("Deferred resolution was not initialized.");
  };
  let fail: (reason: unknown) => void = (): never => {
    throw new Error("Deferred rejection was not initialized.");
  };
  const promise: Promise<undefined> = new Promise<undefined>(
    (
      resolve: (value: undefined | PromiseLike<undefined>) => void,
      reject: (reason?: unknown) => void,
    ): void => {
      complete = (): void => resolve(undefined);
      fail = reject;
    },
  );
  return { promise, resolve: complete, reject: fail };
}

/** The public page port awaits page callbacks and observes only supplied bytes. */
class HookPage implements IAutoMovieHeadlessPage {
  /** One isolated page-global namespace; Node globals remain unchanged. */
  private readonly context: Context;

  /** Screenshot requests observed through the locator port. */
  public screenshots: number = 0;

  /** Caller-requested session retirement attempts. */
  public closes: number = 0;

  /** Values crossing the page evaluation boundary after callback settlement. */
  public readonly results: unknown[] = [];

  /** Bind this page's original hooks without replacing native methods. */
  public constructor(hooks: Record<string, unknown>) {
    this.context = createContext(hooks);
  }

  /** Navigation has no process or network in this portable port. */
  public async goto(): Promise<void> {}

  /** Admit only a hook actually present in this isolated page. */
  public async waitForFunction<T>(
    predicate: (arg: T) => unknown,
    arg: T,
  ): Promise<void> {
    assert.ok(await runHeadlessPageCallback(this.context, predicate, arg));
  }

  /** Styling owns no DOM in this callback-semantics test. */
  public async addStyleTag(): Promise<void> {}

  /** Await the original self-contained page callback, as the driver contract does. */
  public async evaluate<T>(task: (arg: T) => unknown, arg: T): Promise<void> {
    this.results.push(await runHeadlessPageCallback(this.context, task, arg));
  }

  /** Record capture requests rather than claiming a rendered picture. */
  public locator(): IAutoMovieHeadlessLocator {
    return {
      screenshot: async (): Promise<Uint8Array> => {
        ++this.screenshots;
        return new Uint8Array([1, 2, 3]);
      },
    };
  }

  /** Observe the session's public release request. */
  public async close(): Promise<void> {
    ++this.closes;
  }
}

/**
 * Capture waits for hook completion while discarding fulfilled hook values.
 *
 * Scenarios:
 * 1. Delayed seek and pass fulfillment precede capture and writing.
 * 2. Delayed seek and pass rejection preserve their original cause, write no
 *    frame, and leave the returned session available for explicit retirement.
 * 3. Synchronous circular return values remain discarded; writer rejection
 *    stays unwrapped and the caller still closes the session.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public Viewer capture session through an isolated generic page port, holding hook promises across an event-loop turn to observe zero premature screenshot/write requests. All success, rejection and writer cases finish before collected failures propagate; no browser, native drawing or byte decoding is claimed.
 * @evidence contracts/development/testing.md#independent-expectations A capture requires the selected hook to finish first. Explicit gate settlement, exact original refusal identity, undefined page callback results and fixed capture/write counts provide expectations independent of the capture implementation.
 * @evidence contracts/development/testing.md#distinguishing-cases Both seek and pass exercise delayed fulfillment and rejection; synchronous circular values and writer rejection preserve adjacent behavior and explicit session cleanup. Existing headless capture tests own route/style/empty-byte/default/custom and repeated-pass admission.
 * @evidence contracts/development/testing.md#execution-ownership The normal exported test_render_headless_capture_async entry owns all finite cases. Public page callbacks execute in node:vm through the existing helper, with no browser, GPU, filesystem writer or replaced global/method.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Delayed seek and pass fulfillment precede capture and writing.).
 */
export async function test_render_headless_capture_async(): Promise<void> {
  const failures: unknown[] = [];
  for (const hook of ["seek", "pass"] as const)
    for (const rejects of [false, true]) {
      const started: ReturnType<typeof deferred> = deferred();
      const settled: ReturnType<typeof deferred> = deferred();
      const original: Error = new Error(`${hook} delayed refusal`);
      const circular: { self?: unknown } = {};
      circular.self = circular;
      const delayed: () => Promise<unknown> = (): Promise<unknown> => {
        started.resolve();
        const completion: Promise<unknown> = settled.promise.then(
          (): unknown => circular,
        );
        void completion.catch((): undefined => undefined);
        return completion;
      };
      const page: HookPage = new HookPage({
        __afSeek: hook === "seek" ? delayed : (): undefined => undefined,
        __afPass: hook === "pass" ? delayed : (): undefined => undefined,
      });
      let writes: number = 0;
      let captureError: unknown;
      let failed: boolean = false;
      const session: IViewerCaptureSession = await createViewerCaptureSession({
        page,
        url: "http://capture.invalid/",
        passes: hook === "pass" ? ["depth"] : ["beauty"],
      });
      const capture: Promise<void> = session
        .capture(3, async (): Promise<void> => {
          ++writes;
        })
        .catch((error: unknown): void => {
          failed = true;
          captureError = error;
        });
      try {
        await started.promise;
        await setImmediate();
        assert.equal(page.screenshots, 0, `${hook} must finish before capture`);
        assert.equal(writes, 0, `${hook} must finish before writing`);
      } catch (error) {
        failures.push(error);
      } finally {
        if (rejects) settled.reject(original);
        else settled.resolve();
        // Observe the hook even when a regressed wrapper discards its promise.
        await settled.promise.catch((): undefined => undefined);
        await capture;
        await session.close();
      }
      try {
        assert.equal(failed, rejects);
        assert.equal(page.screenshots, rejects ? 0 : 1);
        assert.equal(writes, rejects ? 0 : 1);
        assert.equal(page.closes, 1);
        assert.ok(
          page.results.every(
            (result: unknown): boolean => result === undefined,
          ),
        );
        if (rejects) {
          assert.ok(captureError instanceof AutoMovieHeadlessCaptureError);
          assert.equal(captureError.code, `${hook}-hook`);
          assert.equal(captureError.source, original);
        }
      } catch (error) {
        failures.push(error);
      }
    }

  for (const writerRejects of [false, true]) {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    const page: HookPage = new HookPage({
      __afSeek: (): unknown => circular,
      __afPass: (): unknown => circular,
    });
    const session: IViewerCaptureSession = await createViewerCaptureSession({
      page,
      url: "http://capture.invalid/",
      passes: ["beauty", "depth"],
    });
    const original: Error = new Error("writer refusal");
    let writes: number = 0;
    let captureError: unknown;
    try {
      await session.capture(0, async (): Promise<void> => {
        ++writes;
        if (writerRejects) throw original;
      });
    } catch (error) {
      captureError = error;
    } finally {
      await session.close();
    }
    try {
      assert.equal(captureError, writerRejects ? original : undefined);
      assert.equal(page.screenshots, writerRejects ? 1 : 2);
      assert.equal(writes, writerRejects ? 1 : 2);
      assert.equal(page.closes, 1);
      assert.ok(
        page.results.every((result: unknown): boolean => result === undefined),
      );
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length !== 0)
    throw new AggregateError(failures, "Capture hook completion cases failed.");
}
