import type * as Render from "@automovie/render";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { AutoMovieCaptureBackend } from "./AutoMovieCaptureBackend";
import type { IAutoMovieChromium } from "./IAutoMovieChromium";
import { launchAutoMovieChromium } from "./launchAutoMovieChromium";
import { loadAutoMovieProductionModule } from "./loadAutoMovieProductionModule";
import { readAutoMovieRevision } from "./readAutoMovieRevision";
import { serveAutoMovieDrawPage } from "./serveAutoMovieDrawPage";

/** Milliseconds one page call may take before its cell fails: two minutes, room for SwiftShader to draw a large raster of a heavy scene. */
const TIMEOUT: number = 120_000;

/**
 * The Node host that draws a production's subjects in headless Chromium: one built draw page, one browser, and any number of sessions, captures and renders through them.
 *
 * `open` loads `@automovie/render`, `vite` and `playwright-core` from the production, builds and serves the draw page for a subject module, and launches Chromium with the asked backend. Each `capture` opens a fresh page with the subject and props injected before it loads, describes the subject, plans the request against it, and runs the capture core with `node:fs/promises` as storage and the page's draw function as the draw, so every saved picture comes from the draw function. `close` ends the browser and the server and deletes the built page. `session` opens one subject for any other host that draws through the page, such as `renderAutoMovieVideo`. The `automovie capture` and `automovie render` commands use one host for one subject; a package with many subjects, such as the motion cases, uses one host for all of them.
 *
 * ```ts
 * const host = await AutoMovieCaptureHost.open({ root, module: "src/subjects.ts", backend: "software", env: process.env });
 * try {
 *   const record = await host.capture({ request, props: null });
 * } finally {
 *   await host.close();
 * }
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what open loads, builds and launches, every step of a capture, what close releases, and both users, and shows the order.
 * @evidence contracts/development/design.md#principled-representation A host is the three long-lived resources a capture needs and the render module they were loaded with; a capture is a request, the module's props and a folder.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `open`, `capture`, `close`, and the `backend` the command reports; planning, drawing, files and records are the render package's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No subject kind is named; the module and its props say what is drawn.
 */
export class AutoMovieCaptureHost {
  /** The production's `@automovie/render`, which drew the page; a host that draws through `session` uses it for the rules it applies. */
  public readonly render: typeof Render;

  /** The backend and Chromium version, such as `swiftshader; Chromium 131.0.6778.33`. */
  public readonly backend: string;

  /** The production's root folder. */
  private readonly root: string;

  /** The launched browser. */
  private readonly browser: IAutoMovieChromium.IBrowser;

  /** The served draw page. */
  private readonly page: { url: string; close: () => Promise<void> };

  /** Hold opened resources; `open` acquires them. */
  private constructor(props: {
    render: typeof Render;
    backend: string;
    root: string;
    browser: IAutoMovieChromium.IBrowser;
    page: { url: string; close: () => Promise<void> };
  }) {
    this.render = props.render;
    this.backend = props.backend;
    this.root = props.root;
    this.browser = props.browser;
    this.page = props.page;
  }

  /**
   * Load the production's packages, build and serve the draw page for the subject module, and launch Chromium.
   *
   * It rejects naming a package the production lacks, a missing module, a failed build, and a missing Chromium with the command that installs it; whatever was started before the failure is stopped.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three steps, the refusals and the cleanup.
   * @evidence contracts/development/implementation.md#principled-implementation Every package comes from the production, so the page draws with the renderer the production installed, and the browser is Playwright's pinned build with the stated backend.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Load, serve, launch; building and launching belong to their own functions.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A failure is reported, never answered by another backend or a development server.
   * @evidence contracts/development/implementation.md#efficient-algorithms One build and one launch for every capture of the host.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The built page and the browser serve every capture until `close`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The host owns the server, its scratch folder and the browser until `close`; a failed launch stops the server first.
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
  }): Promise<AutoMovieCaptureHost> {
    const render: typeof Render = loadAutoMovieProductionModule(
      props.root,
      "@automovie/render",
    ) as typeof Render;
    const chromium: IAutoMovieChromium = (
      loadAutoMovieProductionModule(props.root, "playwright-core") as {
        chromium: IAutoMovieChromium;
      }
    ).chromium;

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
        browser: launched.browser,
        page,
      });
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Open a fresh page of the served draw page with a subject and its props injected before it loads, and describe the subject through it.
   *
   * The returned session owns the page; the caller closes it. A page that installs no draw function or cannot describe its subject rejects, and the page is closed first.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is opened and injected, who closes it, and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Every picture of a capture or a render comes through one such session, so both hosts draw through the same function.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One page, one session open, one close on failure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A failed open is reported, never retried.
   * @evidence contracts/development/implementation.md#efficient-algorithms One page per call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call is a fresh page, because props differ between subjects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The page passes to the returned session, or is closed here when opening fails.
   */
  public async session(props: {
    /** Name of the subject, or null for the page's only subject. */
    subject: string | null;

    /** Data the subject module reads, as JSON, or null. */
    props: unknown;
  }): Promise<Render.AutoMovieDrawSession> {
    const page: Render.IAutoMovieDrawPage = await this.browser.newPage();
    try {
      return await this.render.AutoMovieDrawSession.open({
        page,
        url: this.page.url,
        props: { subject: props.subject, props: props.props },
        backend: this.backend,
        timeout: TIMEOUT,
      });
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  /**
   * Capture one subject: open a page with the subject and props injected, plan the request against what it describes, and draw every cell into the folder at `out`.
   *
   * The revision recorded is the production's git commit. It rejects what the planner or the folder refuses before anything is drawn, and a page that installs no draw function; the page is closed on every outcome.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the steps, the revision and the page's lifetime, and which refusals precede drawing.
   * @evidence contracts/development/implementation.md#principled-implementation The capture core plans, writes, records and compares; this host only supplies the subject, the draw and the storage, as law 6 of the campaign asks.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Open the session, plan, open the folder, run, close the page.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Storage is `node:fs/promises` itself, with no adapter.
   * @evidence contracts/development/implementation.md#efficient-algorithms One page per capture; drawing is the capture core's loop.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each capture draws afresh, because the subject or the request differs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The page opened here is closed here; the capture core holds one still at a time.
   */
  public async capture(props: {
    /** The request, as `parseAutoMovieCapturePlanRequest` read it. */
    request: Render.IAutoMovieCapturePlanRequest;

    /** Data the subject module reads, as JSON, or null. */
    props: unknown;

    /** The capture's root folder, relative to the production or absolute; absent, `media/capture/<subject>` of the production. */
    out?: string;

    /** The subject owner's own section of the record, or absent. */
    section?: Readonly<Record<string, unknown>>;
  }): Promise<Extract<Render.IAutoMovieCaptureRecord, { state: "complete" }>> {
    const { render } = this;
    const session: Render.AutoMovieDrawSession = await this.session({
      subject: props.request.subject,
      props: props.props,
    });
    try {
      const plan: Render.IAutoMovieCapturePlan = render.planAutoMovieCapture({
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
        draw: (cell: Render.IAutoMovieCaptureCell): Promise<Render.IAutoMovieCaptureDrawing> =>
          session.drawing(cell, plan),
        folder,
        revision: readAutoMovieRevision(this.root),
        match: "cell",
        ...(props.section === undefined ? {} : { section: props.section }),
      });
    } finally {
      await session.close();
    }
  }

  /**
   * End the browser, stop the server and delete the built page.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is released.
   * @evidence contracts/development/implementation.md#principled-implementation The browser ends before the server it loads pages from.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two releases in order, the second attempted even when the first fails.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A release failure propagates after both are attempted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two calls.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Closing happens once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The release point of the browser, the server and the scratch folder.
   */
  public async close(): Promise<void> {
    try {
      await this.browser.close();
    } finally {
      await this.page.close();
    }
  }
}
