import { createHash } from "node:crypto";
import {
  type Browser,
  type CDPSession,
  type ConsoleMessage,
  type Page,
  type Request,
  type Response,
  chromium,
} from "playwright-core";

import { DEFAULT_CHROME_EXECUTABLE } from "../../../template/scaffold/production/src/executable/render/node/capture/DEFAULT_CHROME_EXECUTABLE";
import { HUMAN_DEBUG_ROUTES } from "../contracts/HUMAN_DEBUG_ROUTES";
import { HumanDebugOptions } from "../contracts/HumanDebugOptions";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";
import type { IHumanDebugSnapshot } from "../contracts/IHumanDebugSnapshot";
import { HumanDebugCaptureMonitor } from "./HumanDebugCaptureMonitor";
import { HumanDebugGenerationSlot } from "./HumanDebugGenerationSlot";
import { HumanDebugSourceHash } from "./HumanDebugSourceHash";
import type { IHumanDebugEnvironment } from "./IHumanDebugEnvironment";
import type { IHumanDebugFrame } from "./IHumanDebugFrame";

/** Requests admitted at once, queued behind the one page. */
const QUEUE: number = 16;

/** Bytes of PNG kept for repeated frames. */
const RETAINED: number = 256 * 1024 * 1024;

/** Attempts of one frame after a source-change or transient module-load failure. */
const ATTEMPTS: number = 8;

/** Seconds waited before attempt n + 1, n times this. */
const BACKOFF: number = 3;

/** Milliseconds a page may take to answer its navigation. */
const MOUNT: number = 60_000;

/** Failed requests the status route keeps. */
const FAILURES: number = 8;

/**
 * One resident headless Chrome page that draws every frame the image and batch routes ask for.
 *
 * Frames are serialized through one queue. Before the page loads, the session hashes the disk
 * source (`HumanDebugSourceHash`), and the page reads that hash again after module evaluation,
 * before it generates. Equality checks disk stability across loading; served-transform freshness
 * also depends on Vite's module invalidation and is not measured by these disk hashes. Vite's
 * update socket is off (`server.hmr: false`), so later saves cannot reach the page. A later frame
 * reuses the page while the disk still hashes the same; otherwise the page loads again, unless the
 * frame asks to keep the loaded page (`keep`, as every batch frame after the first does), so one
 * batch draws all its frames from that page and generation however often files are saved. A save
 * between the two hashes, or a module that fails to load for a moment (the page's module error marker), is a
 * `Human source changed` failure that is retried after 3 s times the attempt, up to eight attempts.
 * A prefixed boot/mount failure instead preserves the page's original exception and fails without
 * a source-change retry. The page stops classifying errors as boot failures once it publishes its handle.
 *
 * A frame that changes the subject (person or piece) generates in the page and holds one of the
 * machine's generation slots meanwhile. The page's work on a frame always ends, with the frame or
 * with a failure naming the stage it was in:
 *
 * - a renderer that crashes (out of memory, most often), a page that closes and a Chrome that
 *   disconnects fail the frame at once;
 * - work past the budget (`HumanDebugCaptureMonitor.FRAME`) fails the frame with the page's JavaScript stack, read by pausing
 *   its debugger;
 * - ready/apply work in a mounted page that does no main-thread work for a minute
 *   (`HumanDebugStall`) fails with its pending requests; cold module mounting keeps the frame deadline.
 *
 * Failures request page closure (and Chrome closure when the page does not answer). Cleanup waits
 * are bounded by the existing grace periods; an unresponsive host may not confirm closure. The
 * slot is released after those cleanup requests, and the next frame loads a fresh page. A request whose client left before its frame started is
 * dropped from the queue. `status` names the running frame's stage, every queued request and the
 * latest failures. A failure's page stack (a subject that threw, a budget overrun) is rewritten to the
 * TypeScript files and lines (`HumanDebugStackMap`) before it is answered, logged and kept. A
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
  private running: HumanDebugCaptureMonitor.IWork | null = null;
  private readonly waiting: Set<HumanDebugCaptureMonitor.IWork> = new Set();
  private readonly frames: Map<
    string,
    IHumanDebugFrame & { nonce: string | null }
  > = new Map();
  private readonly pending: Set<string> = new Set();
  private readonly failures: HumanDebugCaptureMonitor.IStatus.IFailure[] = [];
  private broken: string[] = [];
  private reads: Promise<void>[] = [];

  /**
   * Prepare the session; nothing starts until the first frame.
   *
   * @param environment Server environment.
   * @param origin The server's own origin, read when the first frame starts.
   * @param stacks Rewrites the page module addresses of a failure's text to their TypeScript file and line.
   */
  public constructor(
    private readonly environment: IHumanDebugEnvironment,
    private readonly origin: () => string,
    private readonly stacks: (text: string) => Promise<string> = (
      text: string,
    ): Promise<string> => Promise.resolve(text),
  ) {}

  /** Admitted work, without acquiring anything: the running frame's stage and the queued requests in order. */
  public status(): HumanDebugCaptureMonitor.IStatus {
    const now: number = Date.now();
    const report: (
      work: HumanDebugCaptureMonitor.IWork,
      from: number,
    ) => HumanDebugCaptureMonitor.IStatus.IWork = (
      work: HumanDebugCaptureMonitor.IWork,
      from: number,
    ): HumanDebugCaptureMonitor.IStatus.IWork => ({
      query: work.query,
      stage: work.stage,
      admittedUtc: new Date(work.admitted).toISOString(),
      seconds: Math.round((now - from) / 1000),
    });
    return {
      admitted: this.admitted,
      running:
        this.running === null
          ? null
          : report(this.running, this.running.started ?? this.running.admitted),
      queued: [...this.waiting].map(
        (
          work: HumanDebugCaptureMonitor.IWork,
        ): HumanDebugCaptureMonitor.IStatus.IWork =>
          report(work, work.admitted),
      ),
      source: this.source ?? null,
      subject: this.subject ?? null,
      frames: this.frames.size,
      failures: [...this.failures],
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
    if (this.closed || this.admitted >= QUEUE)
      throw new Error("Human debug capture queue is closed or full");
    const query: string = HumanDebugOptions.write({
      ...options,
      ui: false,
      w: options.w === 0 ? 1200 : options.w,
      h: options.h === 0 ? 1200 : options.h,
    });
    const work: HumanDebugCaptureMonitor.IWork = {
      query,
      stage: "queued",
      admitted: Date.now(),
      started: null,
    };
    this.admitted++;
    this.waiting.add(work);
    if (this.running !== null)
      console.log(
        "[human-debug] queued " +
          query +
          " behind " +
          this.running.query +
          " (" +
          this.running.stage +
          "), " +
          (this.waiting.size - 1) +
          " more ahead",
      );
    const drawn: Promise<IHumanDebugFrame> = this.queue.then(
      async (): Promise<IHumanDebugFrame> => {
        this.waiting.delete(work);
        if (left())
          throw new Error(
            "Human debug request left before its frame started: " + query,
          );
        work.started = Date.now();
        work.stage = "starting";
        this.running = work;
        return this.attempts(work, options, nonce, keep);
      },
    );
    this.queue = drawn
      .then((): void => {})
      .catch((): void => {})
      .finally((): void => {
        if (this.running === work) this.running = null;
      });
    try {
      return await drawn;
    } catch (error) {
      // The failure's page stack is mapped to the TypeScript sources once, here, so the answer,
      // the server log and the status route all name the same file and line.
      const failure: Error =
        error instanceof Error ? error : new Error(String(error));
      failure.message = await this.stacks(failure.message).catch(
        (): string => failure.message,
      );
      this.failures.unshift({
        failedUtc: new Date().toISOString(),
        query,
        stage: work.stage,
        error: failure.message,
      });
      this.failures.splice(FAILURES);
      throw failure;
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

  /** Retry only source-change failures, including the page's transient module-load marker. */
  private async attempts(
    work: HumanDebugCaptureMonitor.IWork,
    options: IHumanDebugOptions,
    nonce: string | null,
    keep: boolean,
  ): Promise<IHumanDebugFrame> {
    for (let attempt: number = 1; ; ++attempt)
      try {
        return {
          ...(await this.draw(work, options, nonce, keep)),
          attempts: attempt,
        };
      } catch (error) {
        if (
          attempt >= ATTEMPTS ||
          !(error instanceof Error) ||
          !/^Human source changed/.test(error.message)
        )
          throw error;
        this.source = undefined;
        work.stage =
          "waiting to retry after a source change (attempt " +
          (attempt + 1) +
          " of " +
          ATTEMPTS +
          ")";
        await delay(attempt * BACKOFF * 1000);
      }
  }

  /** Draw one frame on the current source, loading the page when the source moved and the frame does not keep it. */
  private async draw(
    work: HumanDebugCaptureMonitor.IWork,
    options: IHumanDebugOptions,
    nonce: string | null,
    keep: boolean,
  ): Promise<IHumanDebugFrame> {
    if (this.closed) throw new Error("Human debug capture session is closing");
    const query: string = work.query;
    work.stage = "hashing the source";
    const disk: string =
      keep && this.source !== undefined
        ? this.source
        : await HumanDebugSourceHash(this.environment);
    const key: string = disk + "?" + query;
    const kept: (IHumanDebugFrame & { nonce: string | null }) | undefined =
      this.frames.get(key);
    if (
      kept !== undefined &&
      this.source === disk &&
      (nonce === null || kept.nonce === nonce)
    )
      return { ...kept, cache: "existing-png" };

    const subject: string = JSON.stringify([options.person, options.piece]);
    const generating: boolean =
      this.source !== disk || this.subject !== subject;
    const naming: string =
      "person " +
      (options.person ?? "(first)") +
      (options.piece === null ? ", whole figure" : ", piece " + options.piece);
    work.stage = generating
      ? "waiting for a generation slot"
      : "applying options";
    const slot: HumanDebugGenerationSlot | null = generating
      ? await HumanDebugGenerationSlot.acquire(
          this.environment.slotRoot,
          this.environment.slots,
          "debug viewer " + query,
        )
      : null;
    let snapshot: IHumanDebugSnapshot;
    try {
      const page: Page = await this.resident();
      snapshot = await this.guarded(
        page,
        work,
        (signal: AbortSignal): Promise<IHumanDebugSnapshot> =>
          this.source === disk
            ? this.apply(
                work,
                query,
                generating
                  ? "generating " + naming + " in the loaded page"
                  : "applying options",
                signal,
              )
            : this.load(
                work,
                query,
                disk,
                "loading the page's modules and mounting on source " +
                  disk.slice(0, 12),
                signal,
              ),
      );
    } finally {
      slot?.release();
    }
    this.subject =
      snapshot.subject === null
        ? undefined
        : JSON.stringify([snapshot.subject.person, snapshot.subject.piece]);
    if (snapshot.subject === null)
      throw new Error(
        "Human debug subject failed to load:\n" + snapshot.notices.join("\n"),
      );
    if (/swiftshader|llvmpipe|software/i.test(snapshot.canvas.gpu))
      throw new Error(
        "Human debug capture needs a hardware renderer; got " +
          snapshot.canvas.gpu,
      );

    work.stage = "taking the screenshot";
    const png: Buffer = await this.guarded(
      this.page!,
      work,
      (): Promise<Buffer> =>
        this.page!.locator("#viewport").screenshot({ type: "png" }),
    );
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
  private async load(
    work: HumanDebugCaptureMonitor.IWork,
    query: string,
    before: string,
    stage: string,
    signal: AbortSignal,
  ): Promise<IHumanDebugSnapshot> {
    signal.throwIfAborted();
    this.source = undefined;
    this.subject = undefined;
    this.frames.clear();
    const page: Page = await this.resident();
    signal.throwIfAborted();

    // The page generates its first subject right after its modules evaluate, before `load` would
    // fire, so the navigation waits only for the response.
    work.stage = "navigating";
    this.broken = [];
    this.reads = [];
    await page.goto(this.origin() + HUMAN_DEBUG_ROUTES.page + "?" + query, {
      waitUntil: "commit",
      timeout: MOUNT,
    });
    signal.throwIfAborted();

    // Observe the handle or the boot/mount error string after module evaluation, independently of painting.
    // Source fetching and the first subject belong to ready below. Cold preparation keeps the
    // frame deadline but does not enter the loaded-page sixty-second task-time observer.
    work.stage = stage;
    const mounted: string = await page
      .waitForFunction(
        (): string | null => {
          if ("__humanDebug" in window) return "mounted";
          if (!("__humanDebugFailed" in window)) return null;
          const failure: unknown = (
            window as unknown as { __humanDebugFailed: unknown }
          ).__humanDebugFailed;
          if (
            typeof failure === "object" &&
            failure !== null &&
            "kind" in failure &&
            failure.kind === "mount" &&
            "detail" in failure
          )
            return "mount-failed:\n" + String(failure.detail);
          return String(failure);
        },
        null,
        { timeout: 0, polling: 100 },
      )
      .then(
        (handle: {
          jsonValue(): Promise<string | null>;
        }): Promise<string | null> => handle.jsonValue(),
      )
      .then((value: string | null): string => value ?? "missing")
      .catch((error: unknown): string => "failed: " + String(error));
    signal.throwIfAborted();
    if (mounted.startsWith("mount-failed:\n"))
      throw new Error(
        "Human debug page initialization failed:\n" +
          mounted.slice("mount-failed:\n".length),
      );
    if (mounted !== "mounted") {
      // The modules the server refused (a missing import, a syntax error) name the cause.
      await Promise.race([
        Promise.all(this.reads),
        delay(HumanDebugCaptureMonitor.GRACE),
      ]);
      throw new Error(
        "Human source changed: the page did not mount (" +
          mounted +
          ")" +
          (this.broken.length === 0
            ? ""
            : "; refused modules:\n" + this.broken.slice(0, 8).join("\n")),
      );
    }
    work.stage =
      "loading the mounted page's first subject on source " +
      before.slice(0, 12);
    const snapshot: IHumanDebugSnapshot = await this.watched(
      page.evaluate(
        (): Promise<IHumanDebugSnapshot> =>
          (
            window as unknown as {
              __humanDebug: { ready: Promise<IHumanDebugSnapshot> };
            }
          ).__humanDebug.ready,
      ),
      signal,
    );
    signal.throwIfAborted();

    // The page read the hash after its modules loaded; a save since `before` means its modules
    // may mix two sources.
    if (snapshot.source !== before)
      throw new Error(
        "Human source changed while the page loaded its modules (" +
          String(snapshot.source) +
          ")",
      );
    this.source = before;
    return snapshot;
  }

  /** Apply a query on the loaded page. */
  private async apply(
    work: HumanDebugCaptureMonitor.IWork,
    query: string,
    stage: string,
    signal: AbortSignal,
  ): Promise<IHumanDebugSnapshot> {
    signal.throwIfAborted();
    work.stage = stage;
    return this.watched(
      this.page!.evaluate(
        (search: string): Promise<IHumanDebugSnapshot> =>
          (
            window as unknown as {
              __humanDebug: {
                apply(search: string): Promise<IHumanDebugSnapshot>;
              };
            }
          ).__humanDebug.apply(search),
        query,
      ),
      signal,
    );
  }

  /** Bound one page operation through the shared monitor; this session still owns its disposal. */
  private guarded<T>(
    page: Page,
    work: HumanDebugCaptureMonitor.IWork,
    job: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    return HumanDebugCaptureMonitor.guarded(
      page,
      this.browser,
      work,
      job,
      (failed: Page): Promise<void> => this.discard(failed),
    );
  }

  /** Observe only mounted-page ready/apply work through the existing task-time policy. */
  private watched<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
    return HumanDebugCaptureMonitor.watched(
      this.page!,
      this.pending,
      work,
      HumanDebugCaptureMonitor.GRACE,
      signal,
    );
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
      delay(HumanDebugCaptureMonitor.GRACE).then((): boolean => false),
    ]);
    if (closed || this.browser === undefined) return;
    const browser: Browser = this.browser;
    this.browser = undefined;
    this.page = undefined;
    await Promise.race([
      browser.close().catch((): void => {}),
      delay(HumanDebugCaptureMonitor.GRACE),
    ]);
  }

  /** The resident page has HTTP caching disabled before navigation; source/PNG reuse is separate. WebSockets stay unconnected. */
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
      args: [
        "--ignore-gpu-blocklist",
        "--enable-gpu",
        ...(process.platform === "win32" ? ["--use-angle=d3d11"] : []),
      ],
    });
    const page: Page = await this.browser.newPage({
      viewport: { width: 1600, height: 1300 },
    });
    try {
      // Keep this protocol session attached for the page lifetime: detaching it
      // early would remove the page's cache policy. Target closure releases it.
      const network: CDPSession = await page.context().newCDPSession(page);
      page.once("close", (): void => {
        void network.detach().catch((): void => {});
      });
      await network.send("Network.setCacheDisabled", { cacheDisabled: true });
      console.info("[human-debug] resident page HTTP cache disabled (CDP)");
    } catch (error) {
      await page.close({ runBeforeUnload: false }).catch((): void => {});
      throw error;
    }
    page.setDefaultTimeout(HumanDebugCaptureMonitor.FRAME);
    await page.routeWebSocket(/.*/, (): void => {});
    page.on("pageerror", (error: Error): void =>
      console.error("[human-debug page]", error.stack ?? error.message),
    );

    // The requests the page still waits on, named when a frame stalls.
    this.pending.clear();
    page.on(
      "request",
      (request: Request): void => void this.pending.add(request.url()),
    );
    page.on(
      "requestfinished",
      (request: Request): void => void this.pending.delete(request.url()),
    );
    page.on(
      "requestfailed",
      (request: Request): void => void this.pending.delete(request.url()),
    );

    // A module the server refuses answers with Vite's error page, whose error names the file and line.
    page.on("response", (response: Response): void => {
      if (response.status() < 400) return;
      const address: string = response.url().replace(/^https?:\/\/[^/]+/, "");
      this.reads.push(
        response
          .text()
          .catch((): string => "")
          .then((body: string): void => {
            if (this.broken.length < 16)
              this.broken.push(
                address +
                  " " +
                  response.status() +
                  HumanDebugCaptureMonitor.refusal(body),
              );
          }),
      );
    });

    // The page logs every failed load with its stack; the server log is where a frame's cause is read.
    page.on("console", (message: ConsoleMessage): void => {
      if (message.type() === "error")
        console.error("[human-debug page]", message.text());
    });
    this.page = page;
    return page;
  }

  /** Keep a frame, dropping the oldest while the kept PNG bytes exceed the budget. */
  private keep(
    key: string,
    frame: IHumanDebugFrame & { nonce: string | null },
  ): void {
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

/** Resolve after some milliseconds. */
function delay(milliseconds: number): Promise<undefined> {
  return new Promise<undefined>((resolve: (value: undefined) => void): void => {
    setTimeout(resolve, milliseconds, undefined);
  });
}
