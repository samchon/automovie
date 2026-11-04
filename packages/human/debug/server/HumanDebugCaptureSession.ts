import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render/node/chrome";
import { createHash } from "node:crypto";
import { type Browser, type CDPSession, type ConsoleMessage, type Page, type Request, chromium } from "playwright-core";

import { HUMAN_DEBUG_ROUTES } from "../contracts/HUMAN_DEBUG_ROUTES";
import { HumanDebugOptions } from "../contracts/HumanDebugOptions";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";
import type { IHumanDebugSnapshot } from "../contracts/IHumanDebugSnapshot";
import { HumanDebugGenerationSlot } from "./HumanDebugGenerationSlot";
import { HumanDebugSourceHash } from "./HumanDebugSourceHash";
import { HumanDebugStall } from "./HumanDebugStall";
import type { IHumanDebugEnvironment } from "./IHumanDebugEnvironment";
import type { IHumanDebugFrame } from "./IHumanDebugFrame";

/** Requests admitted at once, queued behind the one page. */
const QUEUE: number = 16;

/** Bytes of PNG kept for repeated frames. */
const RETAINED: number = 256 * 1024 * 1024;

/** Attempts of one frame while saves keep interrupting its module load. */
const ATTEMPTS: number = 8;

/** Seconds waited before attempt n + 1, n times this. */
const BACKOFF: number = 3;

/** Milliseconds a page may take to answer its navigation. */
const MOUNT: number = 60_000;

/**
 * Milliseconds the page's work on one frame (a whole person's generation included) may take: twice
 * the slowest whole-person generation measured on this machine, 481 s on 2026-11-04 (the median of
 * 121 receipts was 114 s).
 */
const FRAME: number = 960_000;

/** Milliseconds given to reading a page's stack, closing a page or closing Chrome. */
const GRACE: number = 10_000;

/** Call frames named when a frame overruns its budget. */
const DEPTH: number = 12;

/**
 * One resident headless Chrome page that draws every frame the image and batch routes ask for.
 *
 * Frames are serialized through one queue. A frame is bound to one source: before the page loads,
 * the session hashes the source (`HumanDebugSourceHash`), and the page reads the hash again once
 * every module has evaluated, before it generates; equal hashes mean the page runs entirely on
 * those bytes, and Vite's update socket is off (`server.hmr: false`), so later saves cannot reach it. A later frame
 * reuses the page while the disk still hashes the same; otherwise the page loads again, unless the
 * frame asks to keep the loaded source (`keep`, as every batch frame after the first does), so one
 * batch draws all its frames from one generation on one source however often files are saved. A save
 * between the two hashes, or a module that fails to load for a moment (the page's module error marker), is a
 * `Human source changed` failure that is retried after 3 s times the attempt, up to eight attempts.
 *
 * A frame that changes the subject (person or piece) generates in the page and holds one of the
 * machine's generation slots meanwhile. The page's work on a frame always ends, with the frame or
 * with a failure naming the stage it was in:
 *
 * - a renderer that crashes (out of memory, most often), a page that closes and a Chrome that
 *   disconnects fail the frame at once;
 * - work past the budget (`FRAME`) fails the frame with the page's JavaScript stack, read by pausing
 *   its debugger;
 * - a page that does no main-thread work for a minute (`HumanDebugStall`) fails the frame with the
 *   requests it still waits on.
 *
 * Each of these closes the page (and Chrome, when the page does not close), so the slot is released
 * and the next frame loads a fresh page. A request whose client left before its frame started is
 * dropped from the queue. `status` names the running frame's stage and every queued request. A
 * software renderer is refused. PNGs are kept per source and canonical options up to 256 MiB, and
 * `fresh` with a new nonce always draws again.
 */
export class HumanDebugCaptureSession {
  private queue: Promise<void> = Promise.resolve();
  private admitted: number = 0;
  private browser: Browser | undefined;
  private page: Page | undefined;
  private source: string | undefined;
  private subject: string | undefined;
  private closed: boolean = false;
  private running: HumanDebugCaptureSession.IWork | null = null;
  private readonly waiting: Set<HumanDebugCaptureSession.IWork> = new Set();
  private readonly frames: Map<string, IHumanDebugFrame & { nonce: string | null }> = new Map();
  private readonly pending: Set<string> = new Set();

  /**
   * Prepare the session; nothing starts until the first frame.
   *
   * @param environment Server environment.
   * @param origin The server's own origin, read when the first frame starts.
   */
  public constructor(
    private readonly environment: IHumanDebugEnvironment,
    private readonly origin: () => string,
  ) {}

  /** Admitted work, without acquiring anything: the running frame's stage and the queued requests in order. */
  public status(): HumanDebugCaptureSession.IStatus {
    const now: number = Date.now();
    const report: (work: HumanDebugCaptureSession.IWork, from: number) => HumanDebugCaptureSession.IStatus.IWork = (
      work: HumanDebugCaptureSession.IWork,
      from: number,
    ): HumanDebugCaptureSession.IStatus.IWork => ({
      query: work.query,
      stage: work.stage,
      admittedUtc: new Date(work.admitted).toISOString(),
      seconds: Math.round((now - from) / 1000),
    });
    return {
      admitted: this.admitted,
      running: this.running === null ? null : report(this.running, this.running.started ?? this.running.admitted),
      queued: [...this.waiting].map((work: HumanDebugCaptureSession.IWork): HumanDebugCaptureSession.IStatus.IWork => report(work, work.admitted)),
      source: this.source ?? null,
      subject: this.subject ?? null,
      frames: this.frames.size,
    };
  }

  /**
   * Draw one frame.
   *
   * @param options Frame options; `ui` is forced off and an unset canvas size becomes 1200 by 1200.
   * @param nonce `fresh` nonce of letters, digits, `_` and `-`, or null to accept a kept frame.
   * @param keep Draw on the page's loaded source even if the disk has moved since; the frame reports that source.
   * @param left Whether the client already left; a frame whose client left before it started is not drawn.
   * @returns The frame; a failure throws with its cause.
   */
  public async frame(
    options: IHumanDebugOptions,
    nonce: string | null,
    keep: boolean = false,
    left: () => boolean = (): boolean => false,
  ): Promise<IHumanDebugFrame> {
    if (nonce !== null && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(nonce))
      throw new Error("fresh needs one to sixty-four letters, digits, _ or -");
    if (this.closed || this.admitted >= QUEUE) throw new Error("Human debug capture queue is closed or full");
    const query: string = HumanDebugOptions.write({
      ...options,
      ui: false,
      w: options.w === 0 ? 1200 : options.w,
      h: options.h === 0 ? 1200 : options.h,
    });
    const work: HumanDebugCaptureSession.IWork = { query, stage: "queued", admitted: Date.now(), started: null };
    this.admitted++;
    this.waiting.add(work);
    if (this.running !== null)
      console.log(
        "[human-debug] queued " + query + " behind " + this.running.query + " (" + this.running.stage + "), " +
          (this.waiting.size - 1) + " more ahead",
      );
    const drawn: Promise<IHumanDebugFrame> = this.queue.then(async (): Promise<IHumanDebugFrame> => {
      this.waiting.delete(work);
      if (left()) throw new Error("Human debug request left before its frame started: " + query);
      work.started = Date.now();
      work.stage = "starting";
      this.running = work;
      return this.attempts(work, options, nonce, keep);
    });
    this.queue = drawn
      .then((): void => {})
      .catch((): void => {})
      .finally((): void => {
        if (this.running === work) this.running = null;
      });
    try {
      return await drawn;
    } finally {
      this.waiting.delete(work);
      this.admitted--;
    }
  }

  /** Close the page and the browser after the admitted work. */
  public async close(): Promise<void> {
    this.closed = true;
    await this.queue;
    await this.browser?.close();
    this.browser = undefined;
    this.page = undefined;
    this.frames.clear();
  }

  /** Retry one frame while saves interrupt its module load. */
  private async attempts(
    work: HumanDebugCaptureSession.IWork,
    options: IHumanDebugOptions,
    nonce: string | null,
    keep: boolean,
  ): Promise<IHumanDebugFrame> {
    for (let attempt: number = 1; ; ++attempt)
      try {
        return { ...(await this.draw(work, options, nonce, keep)), attempts: attempt };
      } catch (error) {
        if (attempt >= ATTEMPTS || !(error instanceof Error) || !/^Human source changed/.test(error.message)) throw error;
        this.source = undefined;
        work.stage = "waiting to retry after a source change (attempt " + (attempt + 1) + " of " + ATTEMPTS + ")";
        await delay(attempt * BACKOFF * 1000);
      }
  }

  /** Draw one frame on the current source, loading the page when the source moved and the frame does not keep it. */
  private async draw(
    work: HumanDebugCaptureSession.IWork,
    options: IHumanDebugOptions,
    nonce: string | null,
    keep: boolean,
  ): Promise<IHumanDebugFrame> {
    if (this.closed) throw new Error("Human debug capture session is closing");
    const query: string = work.query;
    work.stage = "hashing the source";
    const disk: string =
      keep && this.source !== undefined ? this.source : await HumanDebugSourceHash(this.environment);
    const key: string = disk + "?" + query;
    const kept: (IHumanDebugFrame & { nonce: string | null }) | undefined = this.frames.get(key);
    if (kept !== undefined && this.source === disk && (nonce === null || kept.nonce === nonce))
      return { ...kept, cache: "existing-png" };

    const subject: string = JSON.stringify([options.person, options.piece]);
    const generating: boolean = this.source !== disk || this.subject !== subject;
    const naming: string = "person " + (options.person ?? "(first)") + (options.piece === null ? ", whole figure" : ", piece " + options.piece);
    work.stage = generating ? "waiting for a generation slot" : "applying options";
    const slot: HumanDebugGenerationSlot | null = generating
      ? await HumanDebugGenerationSlot.acquire(this.environment.slotRoot, this.environment.slots, "debug viewer " + query)
      : null;
    let snapshot: IHumanDebugSnapshot;
    try {
      const page: Page = await this.resident();
      snapshot = await this.guarded(
        page,
        work,
        this.source === disk
          ? this.apply(work, query, generating ? "generating " + naming + " in the loaded page" : "applying options")
          : this.load(work, query, disk, "loading the page's modules on source " + disk.slice(0, 12) + " and generating " + naming),
      );
    } finally {
      slot?.release();
    }
    this.subject = snapshot.subject === null ? undefined : JSON.stringify([snapshot.subject.person, snapshot.subject.piece]);
    if (snapshot.subject === null)
      throw new Error("Human debug subject failed to load:\n" + snapshot.notices.join("\n"));
    if (/swiftshader|llvmpipe|software/i.test(snapshot.canvas.gpu))
      throw new Error("Human debug capture needs a hardware renderer; got " + snapshot.canvas.gpu);

    work.stage = "taking the screenshot";
    const png: Buffer = await this.guarded(this.page!, work, this.page!.locator("#viewport").screenshot({ type: "png" }));
    const frame: IHumanDebugFrame & { nonce: string | null } = {
      png,
      source: disk,
      query,
      cache: "new-requested-frame",
      capturedUtc: new Date().toISOString(),
      pngSha256: createHash("sha256").update(png).digest("hex"),
      snapshot,
      attempts: 1,
      nonce,
    };
    this.keep(key, frame);
    return frame;
  }

  /** Load the page on the current source and draw the query's first frame. */
  private async load(work: HumanDebugCaptureSession.IWork, query: string, before: string, stage: string): Promise<IHumanDebugSnapshot> {
    this.source = undefined;
    this.subject = undefined;
    this.frames.clear();
    const page: Page = await this.resident();

    // The page generates its first subject right after its modules evaluate, before `load` would
    // fire, so the navigation waits only for the response.
    work.stage = "navigating";
    await page.goto(this.origin() + HUMAN_DEBUG_ROUTES.page + "?" + query, { waitUntil: "commit", timeout: MOUNT });

    // The handle exists once every static import has evaluated; the module script's error marker
    // means a module failed to load, as a half-saved file does. The wait spans a first generation;
    // the frame's budget (`guarded`) bounds it.
    work.stage = stage;
    const mounted: string = await page
      .waitForFunction(
        (): string | null =>
          "__humanDebug" in window
            ? "mounted"
            : "__humanDebugFailed" in window
              ? String((window as unknown as { __humanDebugFailed: unknown }).__humanDebugFailed)
              : null,
        null,
        { timeout: 0 },
      )
      .then((handle: { jsonValue(): Promise<string | null> }): Promise<string | null> => handle.jsonValue())
      .then((value: string | null): string => value ?? "missing")
      .catch((error: unknown): string => "failed: " + String(error));
    if (mounted !== "mounted") throw new Error("Human source changed: the page did not mount (" + mounted + ")");
    const snapshot: IHumanDebugSnapshot = await this.watched(
      page.evaluate(
        (): Promise<IHumanDebugSnapshot> => (window as unknown as { __humanDebug: { ready: Promise<IHumanDebugSnapshot> } }).__humanDebug.ready,
      ),
    );

    // The page read the hash after its modules loaded; a save since `before` means its modules
    // may mix two sources.
    if (snapshot.source !== before)
      throw new Error("Human source changed while the page loaded its modules (" + String(snapshot.source) + ")");
    this.source = before;
    return snapshot;
  }

  /** Apply a query on the loaded page. */
  private async apply(work: HumanDebugCaptureSession.IWork, query: string, stage: string): Promise<IHumanDebugSnapshot> {
    work.stage = stage;
    return this.watched(
      this.page!.evaluate(
        (search: string): Promise<IHumanDebugSnapshot> =>
          (window as unknown as { __humanDebug: { apply(search: string): Promise<IHumanDebugSnapshot> } }).__humanDebug.apply(search),
        query,
      ),
    );
  }

  /**
   * Bound the page's work on a frame: a crash, a closed page, a lost Chrome or the budget's end fails
   * the frame at once with the stage it was in, and a page that failed this way is discarded.
   *
   * A renderer that dies leaves Playwright's evaluation and every CDP call to it unanswered, and a
   * page busy in one long task answers no CDP call, so neither the work nor the stall reading can
   * end the frame by itself.
   *
   * @param page The page doing the work.
   * @param work The frame's queue record, whose stage the failure names.
   * @param job The work.
   * @returns The work's value.
   */
  private async guarded<T>(page: Page, work: HumanDebugCaptureSession.IWork, job: Promise<T>): Promise<T> {
    const started: number = Date.now();
    const browser: Browser | undefined = this.browser;
    const elapsed: () => string = (): string => Math.round((Date.now() - started) / 1000) + " s";
    let release: () => void = (): void => {};
    const ended: Promise<never> = new Promise<never>((_resolve: (value: never) => void, reject: (reason: Error) => void): void => {
      const crashed: () => void = (): void =>
        reject(
          new Error(
            "Human debug page crashed while " + work.stage + ", after " + elapsed() +
              ": Chrome's renderer died, most often out of JavaScript memory; the crash dump is under the browser profile's Crashpad/reports",
          ),
        );
      const closed: () => void = (): void => reject(new Error("Human debug page closed while " + work.stage + ", after " + elapsed()));
      const lost: () => void = (): void => reject(new Error("Human debug Chrome disconnected while " + work.stage + ", after " + elapsed()));
      const timer: NodeJS.Timeout = setTimeout((): void => {
        const stage: string = work.stage;
        void HumanDebugCaptureSession.trace(page).then((stack: string | null): void =>
          reject(
            new Error(
              "Human debug frame exceeded its budget of " + FRAME / 1000 + " s while " + stage + "; " +
                (stack === null ? "the page's stack could not be read" : "the page runs " + stack),
            ),
          ),
        );
      }, FRAME);
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
      return await Promise.race([job, ended]);
    } catch (error) {
      if (error instanceof Error && /^Human debug (page|frame|Chrome) /.test(error.message)) {
        console.error("[human-debug]", error.message);
        release();
        await this.discard(page);
      }
      throw error;
    } finally {
      release();
      job.catch((): void => {});
    }
  }

  /**
   * Wait for the page's work while reading its main-thread task time: a page that holds the frame
   * and does no work for `HumanDebugStall.WINDOW` fails the frame with the requests it still waits
   * on; `guarded` then discards the page, so the generation slot is released and the next frame
   * loads a fresh page.
   *
   * @param work The page's evaluation.
   * @returns The evaluation's value.
   */
  private async watched<T>(work: Promise<T>): Promise<T> {
    const page: Page = this.page!;
    const cdp: CDPSession = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    const samples: HumanDebugStall.ISample[] = [];
    let settled: boolean = false;
    const watch: Promise<never> = (async (): Promise<never> => {
      for (;;) {
        await delay(HumanDebugStall.EVERY);
        if (settled) return new Promise<never>((): void => {});
        const metrics: { metrics: { name: string; value: number }[] } = await cdp.send("Performance.getMetrics");
        const work: number = metrics.metrics.find((m: { name: string; value: number }): boolean => m.name === "TaskDuration")?.value ?? 0;
        samples.push({ at: Date.now(), work });
        if (HumanDebugStall.stalled(samples)) {
          const waiting: string[] = [...this.pending].slice(0, 8);
          throw new Error(
            "Human debug page stalled: no main-thread work for " + HumanDebugStall.WINDOW / 1000 + " s while drawing a frame; " +
              (waiting.length === 0 ? "no request pending" : "pending: " + waiting.join(", ")),
          );
        }
      }
    })();
    try {
      return await Promise.race([work, watch]);
    } finally {
      settled = true;
      watch.catch((): void => {});
      void cdp.detach().catch((): void => {});
    }
  }

  /** Forget a failed page and close it, closing Chrome as well when the page does not close in time. */
  private async discard(page: Page): Promise<void> {
    this.source = undefined;
    this.subject = undefined;
    this.frames.clear();
    if (this.page === page) this.page = undefined;
    const closed: boolean = await Promise.race([
      page
        .close({ runBeforeUnload: false })
        .then((): boolean => true)
        .catch((): boolean => true),
      delay(GRACE).then((): boolean => false),
    ]);
    if (closed || this.browser === undefined) return;
    const browser: Browser = this.browser;
    this.browser = undefined;
    this.page = undefined;
    await Promise.race([browser.close().catch((): void => {}), delay(GRACE)]);
  }

  /** The resident page, starting Chrome once and again after it disconnects; any WebSocket the page opens is held unconnected. */
  private async resident(): Promise<Page> {
    // A Chrome that crashed or was closed under the session is launched again, never reused.
    if (this.browser !== undefined && !this.browser.isConnected()) {
      this.browser = undefined;
      this.page = undefined;
      this.source = undefined;
      this.subject = undefined;
    }
    if (this.page !== undefined && !this.page.isClosed()) return this.page;
    this.browser ??= await chromium.launch({
      executablePath: DEFAULT_CHROME_EXECUTABLE,
      headless: true,
      args: ["--ignore-gpu-blocklist", "--enable-gpu", ...(process.platform === "win32" ? ["--use-angle=d3d11"] : [])],
    });
    const page: Page = await this.browser.newPage({ viewport: { width: 1600, height: 1300 } });
    page.setDefaultTimeout(FRAME);
    await page.routeWebSocket(/.*/, (): void => {});
    page.on("pageerror", (error: Error): void => console.error("[human-debug page]", error.stack ?? error.message));

    // The requests the page still waits on, named when a frame stalls.
    this.pending.clear();
    page.on("request", (request: Request): void => void this.pending.add(request.url()));
    page.on("requestfinished", (request: Request): void => void this.pending.delete(request.url()));
    page.on("requestfailed", (request: Request): void => void this.pending.delete(request.url()));

    // The page logs every failed load with its stack; the server log is where a frame's cause is read.
    page.on("console", (message: ConsoleMessage): void => {
      if (message.type() === "error") console.error("[human-debug page]", message.text());
    });
    this.page = page;
    return page;
  }

  /** Keep a frame, dropping the oldest while the kept PNG bytes exceed the budget. */
  private keep(key: string, frame: IHumanDebugFrame & { nonce: string | null }): void {
    this.frames.delete(key);
    this.frames.set(key, frame);
    let bytes: number = 0;
    for (const value of this.frames.values()) bytes += value.png.length;
    for (const [old, value] of this.frames) {
      if (bytes <= RETAINED) break;
      bytes -= value.png.length;
      this.frames.delete(old);
    }
  }
}

/** Types and helpers of {@link HumanDebugCaptureSession}. */
export namespace HumanDebugCaptureSession {
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

    /** Source hash the page's modules were loaded from. */
    source: string | null;

    /** Person and piece the page holds. */
    subject: string | null;

    /** Kept frames. */
    frames: number;
  }

  export namespace IStatus {
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
   * The page's JavaScript stack, read by pausing its debugger, which interrupts even a page busy in
   * one long task; null when Chrome does not answer within the grace period.
   *
   * @param page The page.
   * @returns Call frames from the innermost, `function (path:line)` joined by ` <- `.
   */
  export async function trace(page: Page): Promise<string | null> {
    const read: Promise<string | null> = (async (): Promise<string> => {
      const cdp: CDPSession = await page.context().newCDPSession(page);
      const paused: Promise<string> = new Promise<string>((resolve: (value: string) => void): void => {
        cdp.once(
          "Debugger.paused",
          (event: { callFrames: { functionName: string; url: string; location: { lineNumber: number } }[] }): void =>
            resolve(
              event.callFrames
                .slice(0, DEPTH)
                .map(
                  (frame: { functionName: string; url: string; location: { lineNumber: number } }): string =>
                    (frame.functionName || "<anonymous>") +
                    " (" + frame.url.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "") + ":" + (frame.location.lineNumber + 1) + ")",
                )
                .join(" <- "),
            ),
        );
      });
      await cdp.send("Debugger.enable");
      await cdp.send("Debugger.pause");
      return paused;
    })().catch((): null => null);
    return Promise.race([read, delay(GRACE).then((): null => null)]);
  }
}

/** Resolve after some milliseconds. */
function delay(milliseconds: number): Promise<undefined> {
  return new Promise<undefined>((resolve: (value: undefined) => void): void => {
    setTimeout(resolve, milliseconds, undefined);
  });
}
