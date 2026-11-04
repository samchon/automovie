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

/** Milliseconds a page may take to load its modules before the load counts as interrupted. */
const MOUNT: number = 60_000;

/** Milliseconds one frame (including a whole person's generation) may take. */
const FRAME: number = 900_000;

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
 * machine's generation slots meanwhile. While the page works on a frame its main-thread task time
 * is read every few seconds (`HumanDebugStall`): a page that does no work for a minute fails the frame
 * with the requests it still waits on and is closed, so a stalled page never holds the slot. A software renderer is refused. PNGs are kept per source
 * and canonical options up to 256 MiB, and `fresh` with a new nonce always draws again.
 */
export class HumanDebugCaptureSession {
  private queue: Promise<void> = Promise.resolve();
  private admitted: number = 0;
  private browser: Browser | undefined;
  private page: Page | undefined;
  private source: string | undefined;
  private subject: string | undefined;
  private closed: boolean = false;
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

  /** Admitted work, without acquiring anything. */
  public status(): { admitted: number; source: string | null; subject: string | null; frames: number } {
    return { admitted: this.admitted, source: this.source ?? null, subject: this.subject ?? null, frames: this.frames.size };
  }

  /**
   * Draw one frame.
   *
   * @param options Frame options; `ui` is forced off and an unset canvas size becomes 1200 by 1200.
   * @param nonce `fresh` nonce of letters, digits, `_` and `-`, or null to accept a kept frame.
   * @param keep Draw on the page's loaded source even if the disk has moved since; the frame reports that source.
   * @returns The frame; a failure throws with its cause.
   */
  public async frame(options: IHumanDebugOptions, nonce: string | null, keep: boolean = false): Promise<IHumanDebugFrame> {
    if (nonce !== null && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(nonce))
      throw new Error("fresh needs one to sixty-four letters, digits, _ or -");
    if (this.closed || this.admitted >= QUEUE) throw new Error("Human debug capture queue is closed or full");
    const query: string = HumanDebugOptions.write({
      ...options,
      ui: false,
      w: options.w === 0 ? 1200 : options.w,
      h: options.h === 0 ? 1200 : options.h,
    });
    this.admitted++;
    const work: Promise<IHumanDebugFrame> = this.queue.then((): Promise<IHumanDebugFrame> =>
      this.attempts(query, options, nonce, keep),
    );
    this.queue = work.then((): void => {}).catch((): void => {});
    try {
      return await work;
    } finally {
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
    query: string,
    options: IHumanDebugOptions,
    nonce: string | null,
    keep: boolean,
  ): Promise<IHumanDebugFrame> {
    for (let attempt: number = 1; ; ++attempt)
      try {
        return { ...(await this.draw(query, options, nonce, keep)), attempts: attempt };
      } catch (error) {
        if (attempt >= ATTEMPTS || !(error instanceof Error) || !/^Human source changed/.test(error.message)) throw error;
        this.source = undefined;
        await new Promise<undefined>((resolve: (value: undefined) => void): void => {
          setTimeout(resolve, attempt * BACKOFF * 1000, undefined);
        });
      }
  }

  /** Draw one frame on the current source, loading the page when the source moved and the frame does not keep it. */
  private async draw(
    query: string,
    options: IHumanDebugOptions,
    nonce: string | null,
    keep: boolean,
  ): Promise<IHumanDebugFrame> {
    if (this.closed) throw new Error("Human debug capture session is closing");
    const disk: string =
      keep && this.source !== undefined ? this.source : await HumanDebugSourceHash(this.environment);
    const key: string = disk + "?" + query;
    const kept: (IHumanDebugFrame & { nonce: string | null }) | undefined = this.frames.get(key);
    if (kept !== undefined && this.source === disk && (nonce === null || kept.nonce === nonce))
      return { ...kept, cache: "existing-png" };

    const subject: string = JSON.stringify([options.person, options.piece]);
    const generating: boolean = this.source !== disk || this.subject !== subject;
    const slot: HumanDebugGenerationSlot | null = generating
      ? await HumanDebugGenerationSlot.acquire(this.environment.slotRoot, this.environment.slots, "debug viewer " + query)
      : null;
    let snapshot: IHumanDebugSnapshot;
    try {
      snapshot = this.source === disk ? await this.apply(query) : await this.load(query, disk);
    } finally {
      slot?.release();
    }
    this.subject = snapshot.subject === null ? undefined : JSON.stringify([snapshot.subject.person, snapshot.subject.piece]);
    if (snapshot.subject === null)
      throw new Error("Human debug subject failed to load:\n" + snapshot.notices.join("\n"));
    if (/swiftshader|llvmpipe|software/i.test(snapshot.canvas.gpu))
      throw new Error("Human debug capture needs a hardware renderer; got " + snapshot.canvas.gpu);

    const png: Buffer = await this.page!.locator("#viewport").screenshot({ type: "png" });
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
  private async load(query: string, before: string): Promise<IHumanDebugSnapshot> {
    this.source = undefined;
    this.subject = undefined;
    this.frames.clear();
    const page: Page = await this.resident();

    // The page generates its first subject right after its modules evaluate, before `load` would
    // fire, so the navigation waits only for the response.
    await page.goto(this.origin() + HUMAN_DEBUG_ROUTES.page + "?" + query, { waitUntil: "commit", timeout: MOUNT });

    // The handle exists once every static import has evaluated; the module script's error marker
    // means a module failed to load, as a half-saved file does. The wait spans a first generation.
    const mounted: string = await page
      .waitForFunction(
        (): string | null =>
          "__humanDebug" in window
            ? "mounted"
            : "__humanDebugFailed" in window
              ? String((window as unknown as { __humanDebugFailed: unknown }).__humanDebugFailed)
              : null,
        null,
        { timeout: FRAME },
      )
      .then((handle: { jsonValue(): Promise<string | null> }): Promise<string | null> => handle.jsonValue())
      .then((value: string | null): string => value ?? "missing")
      .catch((error: unknown): string => "timeout: " + String(error));
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
  private async apply(query: string): Promise<IHumanDebugSnapshot> {
    return this.watched(
      this.page!.evaluate(
        (search: string): Promise<IHumanDebugSnapshot> =>
          (window as unknown as { __humanDebug: { apply(search: string): Promise<IHumanDebugSnapshot> } }).__humanDebug.apply(search),
        query,
      ),
    );
  }

  /**
   * Wait for the page's work while reading its main-thread task time: a page that holds the frame
   * and does no work for `HumanDebugStall.WINDOW` fails the frame with the requests it still waits
   * on, and is closed, so the generation slot is released and the next frame loads a fresh page.
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
        await new Promise<undefined>((resolve: (value: undefined) => void): void => {
          setTimeout(resolve, HumanDebugStall.EVERY, undefined);
        });
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
    } catch (error) {
      if (error instanceof Error && /^Human debug page stalled/.test(error.message)) {
        console.error("[human-debug]", error.message);
        this.source = undefined;
        this.subject = undefined;
        this.page = undefined;
        await page.close().catch((): void => {});
      }
      throw error;
    } finally {
      settled = true;
      await cdp.detach().catch((): void => {});
    }
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
