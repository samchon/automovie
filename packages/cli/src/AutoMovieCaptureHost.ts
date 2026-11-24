import type {
  IAutoMovieCaptureCell,
  IAutoMovieCaptureDrawing,
  IAutoMovieCapturePlan,
  IAutoMovieCapturePlanRequest,
  IAutoMovieCaptureRecord,
} from "@automovie/interface";
import type * as Render from "@automovie/render";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type * as Playwright from "playwright-core";

import type { AutoMovieCaptureBackend } from "./AutoMovieCaptureBackend";
import type { IAutoMovieChromium } from "./IAutoMovieChromium";
import { launchAutoMovieChromium } from "./launchAutoMovieChromium";
import { loadAutoMovieProductionModule } from "./loadAutoMovieProductionModule";
import { readAutoMoviePageTimeout } from "./readAutoMoviePageTimeout";
import { readAutoMovieRevision } from "./readAutoMovieRevision";
import { serveAutoMovieDrawPage } from "./serveAutoMovieDrawPage";

/**
 * The Node host that draws a production's subjects in headless Chromium: one
 * built draw page, one browser, and any number of sessions, captures and
 * renders through them.
 *
 * `open` loads `@automovie/render`, `vite` and `playwright-core` from the
 * production, builds and serves the draw page for a subject module, and
 * launches Chromium with the asked backend. Each `capture` opens a fresh page
 * with the subject and props injected before it loads, describes the subject,
 * plans the request against it, and runs the capture core with
 * `node:fs/promises` as storage and the page's draw function as the draw, so
 * every saved picture comes from the draw function. `close` ends the browser
 * and the server and deletes the built page. `session` opens one subject for
 * any other host that draws through the page, such as `renderAutoMovieVideo`.
 * The `automovie capture` and `automovie render` commands use one host for one
 * subject; a package with many subjects, such as the motion cases, uses one
 * host for all of them.
 *
 * ```ts
 * const host = await AutoMovieCaptureHost.open({
 *   root,
 *   module: "src/subjects.ts",
 *   backend: "software",
 *   env: process.env,
 * });
 * try {
 *   const record = await host.capture({ request, props: null });
 * } finally {
 *   await host.close();
 * }
 * ```
 */
export class AutoMovieCaptureHost {
  /**
   * The production's `@automovie/render`, which drew the page; a host that
   * draws through `session` uses it for the rules it applies.
   */
  public readonly render: typeof Render;

  /**
   * The backend and Chromium version, such as `swiftshader; Chromium
   * 131.0.6778.33`.
   */
  public readonly backend: string;

  /** The production's root folder. */
  private readonly root: string;

  /**
   * Per-call milliseconds for draw-function readiness, subject
   * description/creation and drawing, not a total build or render deadline.
   */
  private readonly timeout: number;

  /** The launched browser. */
  private readonly browser: IAutoMovieChromium.IBrowser;

  /** The served draw page. */
  private readonly page: { url: string; close: () => Promise<void> };

  /** Hold opened resources; `open` acquires them. */
  private constructor(props: {
    render: typeof Render;
    backend: string;
    root: string;
    timeout: number;
    browser: IAutoMovieChromium.IBrowser;
    page: { url: string; close: () => Promise<void> };
  }) {
    this.render = props.render;
    this.backend = props.backend;
    this.root = props.root;
    this.timeout = props.timeout;
    this.browser = props.browser;
    this.page = props.page;
  }

  /**
   * Load the production's packages, build and serve the draw page for the
   * subject module, and launch Chromium.
   *
   * It validates the optional draw-session budget before acquiring resources.
   * It rejects naming a package the production lacks, a missing module, a
   * failed build, and a missing Chromium with the command that installs it;
   * whatever was started before the failure is stopped.
   */
  public static async open(props: {
    /** The production's root folder. */
    root: string;

    /** Path of the subject module, relative to `root` or absolute. */
    module: string;

    /** How the browser draws. */
    backend: AutoMovieCaptureBackend;

    /** The environment, read for `CHROME_PATH`. */
    env: Readonly<Record<string, string | undefined>>;

    /**
     * Per-call milliseconds for draw-function readiness, subject
     * description/creation and drawing; absent, 120000. This is not a total
     * build or render deadline. Invalid timer delays fail before resources are
     * acquired.
     */
    timeout?: number;
  }): Promise<AutoMovieCaptureHost> {
    const timeout: number = readAutoMoviePageTimeout(props.timeout);

    const render: typeof Render = loadAutoMovieProductionModule<typeof Render>(
      props.root,
      "@automovie/render",
    );
    const chromium: IAutoMovieChromium = loadAutoMovieProductionModule<
      typeof Playwright
    >(props.root, "playwright-core").chromium;

    // Vite's CommonJS entry warns once per load; the command loads it on purpose.
    process.env.VITE_CJS_IGNORE_WARNING = "true";
    const page: { url: string; close: () => Promise<void> } =
      await serveAutoMovieDrawPage({
        root: props.root,
        module: props.module,
        vite: loadAutoMovieProductionModule(props.root, "vite"),
      });
    try {
      const launched: Awaited<ReturnType<typeof launchAutoMovieChromium>> =
        await launchAutoMovieChromium({
          chromium,
          backend: props.backend,
          env: props.env,
        });
      return new AutoMovieCaptureHost({
        render,
        backend: launched.backend,
        root: props.root,
        timeout,
        browser: launched.browser,
        page,
      });
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Open a fresh page of the served draw page with a subject and its props
   * injected before it loads, and describe the subject through it.
   *
   * The returned session owns the page; the caller closes it. An uncaught
   * browser error during initialization rejects immediately with the original
   * cause and logs its stack; console errors are forwarded too. A page that
   * installs no draw function or cannot describe its subject rejects, and the
   * page is closed first.
   */
  public async session(props: {
    /** Name of the subject, or null for the page's only subject. */
    subject: string | null;

    /** Data the subject module reads, as JSON, or null. */
    props: unknown;
  }): Promise<Render.AutoMovieDrawSession> {
    const page: Awaited<ReturnType<IAutoMovieChromium.IBrowser["newPage"]>> =
      await this.browser.newPage();

    // A module can fail before installing the draw port, leaving only a timeout.
    // Forward its original browser error while the failed page is still alive.
    const failed: Promise<never> = new Promise((_resolve, reject): void => {
      page.on?.("pageerror", (error: Error): void => {
        console.error("Draw page error:", error.stack ?? error.message);
        reject(
          new Error(
            `The draw page at ${this.page.url} failed during initialization`,
            { cause: error },
          ),
        );
      });
    });
    page.on?.(
      "console",
      (message: { type(): string; text(): string }): void => {
        if (message.type() === "error")
          console.error("Draw page console:", message.text());
      },
    );
    try {
      return await Promise.race([
        this.render.AutoMovieDrawSession.open({
          page,
          url: this.page.url,
          props: { subject: props.subject, props: props.props },
          backend: this.backend,
          timeout: this.timeout,
        }),
        failed,
      ]);
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Capture one subject: open a page with the subject and props injected, plan
   * the request against what it describes, and draw every cell into the folder
   * at `out`.
   *
   * A subject with a sound list is first handed its dialogue mouths: its lines
   * are read from the production root, admitted on the clock
   * `autoMovieVideoFrameRate` gives its frame rate, and planned by
   * `planAutoMovieDialogueMouths`, as the delivery render plans them, so a
   * still shows the mouth the delivered frame at the same second shows. A line
   * the admission refuses fails the capture. The revision recorded is the
   * production's git commit. It rejects what the planner or the folder refuses
   * before anything is drawn, and a page that installs no draw function; the
   * page is closed on every outcome.
   */
  public async capture(props: {
    /** The request, as `parseAutoMovieCapturePlanRequest` read it. */
    request: IAutoMovieCapturePlanRequest;

    /** Data the subject module reads, as JSON, or null. */
    props: unknown;

    /**
     * The capture's root folder, relative to the production or absolute;
     * absent, `media/capture/<subject>` of the production.
     */
    out?: string;

    /** The subject owner's own section of the record, or absent. */
    section?: Readonly<Record<string, unknown>>;
  }): Promise<Extract<IAutoMovieCaptureRecord, { state: "complete" }>> {
    const { render } = this;
    const session: Render.AutoMovieDrawSession = await this.session({
      subject: props.request.subject,
      props: props.props,
    });
    try {
      // A film with a sound list speaks in its stills as in its delivered
      // frames: the same lines on the same clock give the same mouths.
      const { sound, fps, durationSeconds } = session.subject;
      if (sound !== undefined) {
        const [numerator, denominator]: readonly [number, number] =
          render.autoMovieVideoFrameRate(fps);
        const frameRate: { numerator: number; denominator: number } = {
          numerator,
          denominator,
        };
        await session.speak(
          render.planAutoMovieDialogueMouths({
            lines: await render.admitAutoMovieFilmDialogue({
              sound,
              frameRate,
              totalFrames: Math.round(durationSeconds * fps),
              read: (file: string): Promise<Uint8Array> =>
                fs.readFile(path.resolve(this.root, file)),
            }),
            speakers: sound.speakers,
            frameRate,
          }),
        );
      }
      const plan: IAutoMovieCapturePlan = render.planAutoMovieCapture({
        request: props.request,
        subject: session.subject,
        cuts: [],
      });
      const folder: Render.AutoMovieCaptureFolder =
        await render.AutoMovieCaptureFolder.open({
          storage: fs,
          root: path.resolve(
            this.root,
            props.out ?? path.join("media", "capture", session.subject.name),
          ),
          round: props.request.round,
          compare: props.request.compare,
        });
      return await render.runAutoMovieCapture({
        plan,
        draw: (
          cell: IAutoMovieCaptureCell,
        ): Promise<IAutoMovieCaptureDrawing> => session.drawing(cell, plan),
        folder,
        revision: readAutoMovieRevision(this.root),
        match: "cell",
        ...(props.section === undefined ? {} : { section: props.section }),
      });
    } finally {
      await session.close();
    }
  }

  /** End the browser, stop the server and delete the built page. */
  public async close(): Promise<void> {
    try {
      await this.browser.close();
    } finally {
      await this.page.close();
    }
  }
}
