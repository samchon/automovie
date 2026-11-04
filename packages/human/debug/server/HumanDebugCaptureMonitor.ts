import type { Browser, CDPSession, Page } from "playwright-core";

import { HumanDebugStall } from "./HumanDebugStall";
import { HumanDebugCaptureProbe } from "./HumanDebugCaptureProbe";

/**
 * Frame failure monitoring and status vocabulary borrowed by the capture session.
 * Queue admission, generation slots, source identity, page ownership and PNG retention stay in
 * HumanDebugCaptureSession. Cold module mounting is guarded by the frame deadline, not by the
 * loaded-page ready/apply work observer.
 * Boot error publication belongs to debug.html/the page entry, and the session interprets their
 * permanent initialization marker separately from a transient module-fetch failure.
 *
 * @evidence contracts/common.md#principled-implementation Preserves the existing deadline, page/browser failure events, loaded-page task-time observer and original error details.
 * @evidence contracts/common.md#clear-and-simple-design Owns monitoring and its small status records; the session supplies page disposal and retains all scheduling and resource ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not generate a person, synthesize a successful frame, change admission or bypass source validation.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes cold mounting from loaded-page observation, milliseconds from seconds, and borrowed resources from owned listeners.
 * @evidence contracts/performance.md#efficient-algorithms Deadline events are constant work; task samples follow the existing five-second cadence and sixty-second window.
 * @evidence contracts/performance.md#reuse-equivalent-work Borrows the session's page, work record and pending requests without cloning source, geometry or retained PNGs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Guards release listeners/timers; probe finally covers setup, work and cancellation; trace cleanup waiting never extends its absolute grace and even late acquisition receives resume/disable/detach requests, and owned timers/listeners are cancelled.
 */
export namespace HumanDebugCaptureMonitor {
  /**
   * Milliseconds the page's work on one frame (a whole person's generation included) may take: twice
   * the slowest whole-person generation measured on this machine, 481 s on 2026-11-04 (the median of
   * 121 receipts was 114 s).
   */
  export const FRAME: number = 960_000;

  /** Milliseconds given to reading a page's stack, closing a page or closing Chrome. */
  export const GRACE: number = 10_000;

  /** Call frames named when a frame overruns its budget. */
  const DEPTH: number = 12;

  /**
   * Bound the page's work on a frame: a crash, a closed page, a lost Chrome or the budget's end fails
   * the frame at once with the stage it was in, and a page that failed this way is discarded.
   * Work and observer failures also discard it before the caller can return its generation slot.
   *
   * A renderer that dies leaves Playwright's evaluation and every CDP call to it unanswered, and a
   * page busy in one long task answers no CDP call, so neither the work nor the stall reading can
   * end the frame by itself.
   *
   * @param page The page doing the work.
   * @param browser The browser that owns the page when this guard starts.
   * @param work The frame's queue record, whose stage the failure names.
   * @param operation Starts the work with this guard's cancellation signal.
   * @param discard The session's existing failed-page disposal operation.
   * @param limits Frame and cleanup milliseconds; production uses FRAME/GRACE, owned CPU cases use smaller budgets.
   * @returns The work's value.
   */
  export async function guarded<T>(
    page: Page, browser: Browser | undefined, work: IWork, operation: (signal: AbortSignal) => Promise<T>, discard: (page: Page) => Promise<void>,
    limits: { frame: number; grace: number } = { frame: FRAME, grace: GRACE },
  ): Promise<T> {
    const started: number = Date.now();
    const elapsed: () => string = (): string => Math.round((Date.now() - started) / 1000) + " s";
    const cancellation: AbortController = new AbortController();
    let settled: boolean = false;
    let tracing: Promise<string | null> | undefined;
    let job: Promise<T> | undefined;
    let closingDeadline: number | undefined;
    let release: () => void = (): void => {};

    const ended: Promise<never> = new Promise<never>((_resolve: (value: never) => void, reject: (reason: Error) => void): void => {
      const crashed: () => void = (): void => reject(new Error("Human debug page crashed while " + work.stage + ", after " + elapsed() +
        ": Chrome's renderer died, most often out of JavaScript memory; the crash dump is under the browser profile's Crashpad/reports"));
      const closed: () => void = (): void => reject(new Error("Human debug page closed while " + work.stage + ", after " + elapsed()));
      const lost: () => void = (): void => reject(new Error("Human debug Chrome disconnected while " + work.stage + ", after " + elapsed()));
      const timer: NodeJS.Timeout = setTimeout((): void => {
        const stage: string = work.stage;
        closingDeadline = Date.now() + limits.grace;
        tracing = trace(page, cancellation.signal, limits.grace, closingDeadline);
        void tracing.then((stack: string | null): void => {
          if (settled) return;
          reject(new Error("Human debug frame exceeded its budget of " + limits.frame / 1000 + " s while " + stage + "; " +
            (stack === null ? "the page's stack could not be read" : "the page runs " + stack)));
        });
      }, limits.frame);
      page.on("crash", crashed);
      page.on("close", closed);
      browser?.on("disconnected", lost);
      release = (): void => {
        clearTimeout(timer);
        page.off("crash", crashed);
        page.off("close", closed);
        browser?.off("disconnected", lost);
      };
    });
    try {
      job = operation(cancellation.signal);
      void job.catch((): void => {});
      return await Promise.race([job, ended]);
    } catch (error) {
      if (error instanceof Error && /^Human debug (page|frame|Chrome) /.test(error.message))
        console.error("[human-debug]", error.message);
      release();
      closingDeadline ??= Date.now() + limits.grace;
      cancellation.abort();
      try { await discard(page); } catch { /* Disposal cannot replace the frame failure. */ }
      throw error;
    } finally {
      settled = true;
      release();
      closingDeadline ??= Date.now() + limits.grace;
      cancellation.abort();
      await HumanDebugCaptureProbe.settle(Promise.allSettled([job, tracing]), closingDeadline);
    }
  }

  /**
   * Wait for the page's work while reading its main-thread task time: a page that holds the frame
   * and does no work for `HumanDebugStall.WINDOW` fails the frame with the requests it still waits
   * on; `guarded` then discards the page, so the generation slot is released and the next frame
   * loads a fresh page.
   *
   * @param page The already mounted page whose ready/apply work is observed.
   * @param pending The session's live request set, borrowed without mutation.
   * @param work The page's evaluation.
   * @param grace Cleanup milliseconds, defaulting to the existing GRACE.
   * @param signal Cancellation from the surrounding frame guard.
   * @returns The evaluation's value.
   */
  export async function watched<T>(page: Page, pending: ReadonlySet<string>, work: Promise<T>, grace: number = GRACE, signal?: AbortSignal): Promise<T> {
    void work.catch((): void => {});
    const probe: HumanDebugCaptureProbe = new HumanDebugCaptureProbe((): Promise<CDPSession> => page.context().newCDPSession(page), grace);
    const cancelled: () => void = (): void => probe.cancel();
    signal?.addEventListener("abort", cancelled, { once: true });
    if (signal?.aborted) probe.cancel();
    const samples: HumanDebugStall.ISample[] = [];
    const watch: Promise<never> = probe.call(async (cdp: CDPSession): Promise<never> => {
      await probe.wait(cdp.send("Performance.enable"));
      for (;;) {
        await probe.delay(HumanDebugStall.EVERY);
        const metrics: { metrics: { name: string; value: number }[] } = await probe.wait(cdp.send("Performance.getMetrics"));
        const task: number = metrics.metrics.find((m: { name: string; value: number }): boolean => m.name === "TaskDuration")?.value ?? 0;
        samples.push({ at: Date.now(), work: task });
        if (HumanDebugStall.stalled(samples)) {
          const waiting: string[] = [...pending].slice(0, 8);
          throw new Error("Human debug page stalled: no main-thread work for " + HumanDebugStall.WINDOW / 1000 + " s while drawing a frame; " +
            (waiting.length === 0 ? "no request pending" : "pending: " + waiting.join(", ")));
        }
      }
    });
    let result: T;
    try {
      result = await Promise.race([work, watch]);
    } finally {
      signal?.removeEventListener("abort", cancelled);
      await probe.close();
      void watch.catch((): void => {});
    }
    signal?.throwIfAborted();
    return result;
  }


  /** One admitted request: queued until its frame starts, then the running frame. */
  export interface IWork {
    /** Canonical options. */
    query: string;

    /** What the frame is doing now, named by every failure and by `status`. */
    stage: string;

    /** Milliseconds on the server's clock when the request was admitted. */
    admitted: number;

    /** Milliseconds when its frame started, null while queued. */
    started: number | null;
  }

  /** The status route's view of the session. */
  export interface IStatus {
    /** Requests admitted, the running one included. */
    admitted: number;

    /** The frame being drawn, its seconds counted from its start. */
    running: IStatus.IWork | null;

    /** Requests waiting behind it in order, their seconds counted from admission. */
    queued: IStatus.IWork[];

    /** Disk source inventory hash retained for the loaded page, or null while none is accepted. */
    source: string | null;

    /** Person and piece the page holds. */
    subject: string | null;

    /** Kept frames. */
    frames: number;

    /** The latest failed requests, newest first. */
    failures: IStatus.IFailure[];
  }

  export namespace IStatus {
    /** One failed request: its cause, page stack mapped to the TypeScript sources. */
    export interface IFailure {
      /** UTC time it failed. */
      failedUtc: string;

      /** Canonical options. */
      query: string;

      /** The stage it was in. */
      stage: string;

      /** The failure's message, with the page's stack when the page threw. */
      error: string;
    }

    /** One admitted request as `status` reports it. */
    export interface IWork {
      /** Canonical options. */
      query: string;

      /** What it is doing now, `queued` while it waits. */
      stage: string;

      /** UTC time it was admitted. */
      admittedUtc: string;

      /** Seconds it has run, or waited while queued. */
      seconds: number;
    }
  }

  /**
   * The cause Vite's error page states for a refused module: its message and the file, line and
   * column it names, read from the error the page embeds; empty when the body holds none.
   *
   * @param body Response body of the refused request.
   * @returns `: <message> (<file>:<line>:<column>)`, or empty.
   */
  export function refusal(body: string): string {
    const embedded: RegExpExecArray | null = /const error = (\{.*\})\s*$/m.exec(body);
    if (embedded === null) return "";
    try {
      const error: { message?: unknown; id?: unknown; loc?: { file?: unknown; line?: unknown; column?: unknown } } = JSON.parse(embedded[1]!);
      const file: unknown = error.loc?.file ?? error.id;
      const at: string =
        typeof file === "string" ? " (" + file + (typeof error.loc?.line === "number" ? ":" + error.loc.line + ":" + String(error.loc.column) : "") + ")" : "";
      return typeof error.message === "string" ? ": " + error.message + at : at;
    } catch {
      return "";
    }
  }

  /**
   * The page's JavaScript stack, read by pausing its debugger, which interrupts even a page busy in
   * one long task; null when Chrome does not answer within the grace period.
   *
   * @param page The page.
   * @param signal The guard's cancellation when work finishes before its deadline trace.
   * @param grace Existing total trace/read/cleanup budget, milliseconds.
   * @param deadline Shared absolute grace deadline from the guard, or now plus grace.
   * @returns Call frames from the innermost, `function (path:line)` joined by ` <- `.
   */
  export async function trace(page: Page, signal?: AbortSignal, grace: number = GRACE, deadline: number = Date.now() + grace): Promise<string | null> {
    const probe: HumanDebugCaptureProbe = new HumanDebugCaptureProbe((): Promise<CDPSession> => page.context().newCDPSession(page), grace, true, deadline);
    const cancelled: () => void = (): void => probe.cancel();
    signal?.addEventListener("abort", cancelled, { once: true });
    if (signal?.aborted) probe.cancel();
    const expiry: Promise<void> = probe.delay(Math.max(0, deadline - Date.now())).then((): void => probe.cancel()).catch((): void => {});
    try {
      return await probe.call(async (cdp: CDPSession): Promise<string> => {
        const paused: { promise: Promise<string>; listener: (event: { callFrames: { functionName: string; url: string; location: { lineNumber: number; columnNumber?: number } }[] }) => void } = {
          promise: Promise.resolve(""), listener: (): void => {},
        };
        paused.promise = new Promise<string>((resolve: (value: string) => void): void => {
          paused.listener = (event: { callFrames: { functionName: string; url: string; location: { lineNumber: number; columnNumber?: number } }[] }): void =>
            resolve(event.callFrames.slice(0, DEPTH).map((frame: { functionName: string; url: string; location: { lineNumber: number; columnNumber?: number } }): string =>
              (frame.functionName || "<anonymous>") + " (" + frame.url + ":" + (frame.location.lineNumber + 1) + ":" + ((frame.location.columnNumber ?? 0) + 1) + ")").join(" <- "));
        });
        cdp.once("Debugger.paused", paused.listener);
        try {
          await probe.wait(cdp.send("Debugger.enable"));
          await probe.wait(cdp.send("Debugger.pause"));
          return await probe.wait(paused.promise);
        } finally {
          cdp.off("Debugger.paused", paused.listener);
        }
      });
    } catch {
      return null;
    } finally {
      probe.cancel();
      signal?.removeEventListener("abort", cancelled);
      await probe.close();
      await expiry;
    }
  }
}
