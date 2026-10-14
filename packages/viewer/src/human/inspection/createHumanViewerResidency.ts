import type { ConsoleMessage, Page } from "playwright";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { ICreateHumanViewerResidencyProps } from "./ICreateHumanViewerResidencyProps.js";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";
import type { IHumanViewerResidentPage } from "./IHumanViewerResidentPage.js";
import type { IHumanViewerWindow } from "./IHumanViewerWindow.js";
import type { IHumanViewerWorkerHeap } from "./IHumanViewerWorkerHeap.js";
import { launchHumanViewerPage } from "./launchHumanViewerPage.js";
import { observeHumanViewerRendererTarget } from "./observeHumanViewerRendererTarget.js";
import { readHumanViewerWork } from "./readHumanViewerWork.js";
import { readHumanViewerWorkerHeaps } from "./readHumanViewerWorkerHeaps.js";
import { routeHumanViewerConsole } from "./routeHumanViewerConsole.js";
import { watchHumanViewerMainFrame } from "./watchHumanViewerMainFrame.js";

/**
 * Own the resident browser, mutable frame identity and renderer recovery. Before renewing failed dispatch ownership, recovery awaits the failed Page's public close completion; refusal keeps that owner unknown and prevents replacement. Public Page/CDP completion is not independent OS/GPU kernel termination proof. Readiness and heap readers follow the current resident; shutdown withdraws recovery and late openings close their acquired browser.
 *
 * @evidence contracts/common.md#principled-implementation Resident opening installs actual console/frame/renderer observation; recovery starts observer cleanup independently and awaits failed Page close before renewing dispatch, retaining/refusing unknown ownership after close failure rather than treating an unanswered close as settlement.
 * @evidence contracts/common.md#clear-and-simple-design Current resident identity, source readiness and display failure remain distinct, with shared open/recovery paths and a joined shutdown owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unproven source labels stay stale; renderer text is page-reported and not independent hardware proof. A closed owner refuses recovery or closes late acquisitions, and prior browser-close refusal prevents fresh-browser acquisition.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies browser/dispatch ownership, public Page-close completion and its OS/GPU proof limit, readiness authority and exact page-listener withdrawal on shutdown/recovery.
 * @evidence contracts/performance.md#efficient-algorithms State updates are constant-time apart from error arrays and actual browser/heap queries; repeated failure reports for the same resident coalesce into one recovery.
 * @evidence contracts/performance.md#reuse-equivalent-work Recovery reuses a connected browser when possible and opens a new one only after that attempt fails; resident identity prevents obsolete page observations from authorizing another owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Current references retain one resident/observer, while old observer cleanup promises can remain pending across relaunches without a numeric cap; errors are uncapped, exact page listeners withdraw through their observer retirement, and close independently asks current browser/observer owners with sticky completion. Failed Page close prevents renewal and keeps its resident reference.
 */
export function createHumanViewerResidency(
  props: ICreateHumanViewerResidencyProps,
): {
  readonly page: Page;
  readonly renderer: string;
  readonly errors: string[];
  readonly readyRevision: string;
  readonly pageRevision: string;
  readonly pageFailure: string | null;
  readonly pageWait: string | null;
  readonly work: HumanViewerWork | null;
  readonly relaunches: number;
  firstReady: Promise<undefined>;
  open: () => Promise<void>;
  readHeap: () => Promise<IHumanViewerHeapUsage>;
  readLiveHeap: () => Promise<IHumanViewerHeapUsage>;
  readWorkerHeaps: (collect: boolean) => Promise<IHumanViewerWorkerHeap[]>;
  error: (error: unknown) => void;
  close: () => Promise<void>;
} {
  let page: Page;
  let renderer: string = "";
  let closed: boolean = false;
  let errors: string[] = [];
  /** Graphics/display failure can recover without accepting a failed source. */
  let displayError: string | undefined;
  /**
   * The revision the ready generation's code is: its window's proven label, or `unproven <page revision>` when the code could not be proven to be any revision, which never equals a current revision, so its frames are stale.
   */
  let readyRevision: string = "";
  /** The catalogue revision the ready page reports, for the capture identity check. */
  let pageRevision: string = "";
  /** Why the page failed for good, or null while it can still draw. */
  let pageFailure: string | null = null;
  /** What a reloaded page waits for, or null when it never reloaded since its last generation. */
  let pageWait: string | null = null;
  let work: HumanViewerWork | null = null;
  /** Heap readings of the resident page; the readers are bound once the page exists. */
  let readHeap: () => Promise<IHumanViewerHeapUsage> =
    (): Promise<IHumanViewerHeapUsage> =>
      Promise.reject(new Error("No page yet"));
  let readLiveHeap: () => Promise<IHumanViewerHeapUsage> =
    (): Promise<IHumanViewerHeapUsage> =>
      Promise.reject(new Error("No page yet"));
  /** The open page, its browser and heap readers; null before the first one opens. */
  let resident: IHumanViewerResidentPage | null = null;
  /** Detach the current page's renderer observer. */
  let stopRenderer: () => Promise<void> = async (): Promise<void> => {};
  /** Pages opened again after their renderer exited, for /health. */
  let relaunches: number = 0;
  /** The failed page being replaced, so repeated reports of one exit recover once. */
  let recovering: IHumanViewerResidentPage | null = null;

  /** Resolves once the first page of this server is ready, whichever opening made it so. */
  let announceFirstReady: () => void = (): void => {};
  const firstReady: Promise<undefined> = new Promise<undefined>(
    (resolve: (value: undefined) => void): void => {
      announceFirstReady = (): void => resolve(undefined);
    },
  );

  /**
   * Open the resident page and wait for its first source generation. A fresh browser is launched when asked or when the current one is gone; otherwise the connected browser is reused. The first opening reports startup phases; a replacement reports through `pageWait`. Every page gets the same observers, so a replacement fails, reloads and reports exactly as the first one did. A page that fails while it waits is left to the recovery that replaces it: its opening returns without error, since it is no longer the page the server serves.
   */
  async function openResidentPage(
    first: boolean,
    freshBrowser: boolean,
  ): Promise<void> {
    if (closed) throw new Error("The resident page owner is closed.");
    if (freshBrowser) await resident?.browser.close();
    const opened: IHumanViewerResidentPage = await launchHumanViewerPage(
      freshBrowser ? undefined : resident?.browser,
    );
    if (closed) {
      await opened.browser.close();
      throw new Error("The resident page owner closed during opening.");
    }
    resident = opened;
    page = opened.page;
    readHeap = opened.readHeap;
    readLiveHeap = opened.readLiveHeap;
    stopRenderer = await observeHumanViewerRendererTarget({
      browser: opened.browser,
      page: opened.page,
      failed: (cause: string, physicalSettled: boolean): void =>
        recoverResidentPage(opened, cause, physicalSettled),
    });
    if (closed) {
      return createAutoMovieResourceRetirement(
        [
          stopRenderer,
          async (): Promise<void> => {
            await opened.browser.close();
          },
        ],
        {
          error: new Error(
            "The resident page owner closed during observation.",
          ),
        },
      )();
    }
    // A Vite full reload replaces the host page and its committed generation:
    // until a new generation is ready nothing can draw, which captures and
    // admissions report instead of waiting on a page that lost its handle.
    const stopMainFrame: () => void = watchHumanViewerMainFrame(
      opened.page,
      (): void => {
        if (closed || resident !== opened) return;
        if (readyRevision === "") return;
        readyRevision = "";
        // The reloaded page's candidates opened their holds over requests the
        // reload ended; the windows close with them, never proven.
        pageWait = `the page reloaded at ${new Date().toISOString()}; waiting for a source generation`;
        console.log("PAGE RELOADED " + pageWait);
        props.publish();
      },
    );
    function pageError(error: Error): void {
      if (closed || resident !== opened) return;
      errors.push(error.message);
      console.error(error.message);
    }
    function pageConsole(message: ConsoleMessage): void {
      if (closed || resident !== opened) return;
      routeHumanViewerConsole(message.text(), {
        work: (text: string): void => {
          work = readHumanViewerWork(text);
          if (work?.completed !== undefined)
            console.log("NUMERICAL STAGE " + JSON.stringify(work));
          props.progress();
          if (work !== null) props.sample(work);
        },
        error: (cause: string): void => {
          errors = [cause];
        },
        displayError: (cause: string): void => {
          displayError = cause;
        },
        displayRecovered: (): void => {
          displayError = undefined;
        },
        ready: (line: string): void => {
          const [revision, label]: string[] = line.split(" ");
          errors = [];
          displayError = undefined;
          pageRevision = revision;
          readyRevision =
            label === undefined || label === "-"
              ? "unproven " + revision
              : label;
          pageWait = null;
          console.log(
            `GENERATION READY ${new Date().toISOString()} ${readyRevision.slice(0, 21)}` +
              (readyRevision === props.inventory().revision
                ? " (current)"
                : " (stale)"),
          );
          // Only code proven to be the current revision warms thumbnails.
          if (readyRevision === props.inventory().revision)
            props.sourceReady(readyRevision);
          // A ready generation can admit the inputs still pending.
          props.retryAdmissions(
            "generation " + revision.slice(0, 12) + " ready",
          );
        },
        admission: (): void => props.retryAdmissions("a viewer frame loaded"),
        restart: (reason: string): void =>
          console.log(
            `CANDIDATE RESTART ${new Date().toISOString()} ${reason}`,
          ),
        firstAddress: (reason: string): void =>
          console.log(
            `CANDIDATE FIRST ADDRESS ${new Date().toISOString()} ${reason}`,
          ),
        cache: (text: string): void =>
          console.log(`NUMERICAL CACHE ${new Date().toISOString()} ${text}`),
      });
    }
    opened.page.on("pageerror", pageError);
    opened.page.on("console", pageConsole);
    const rendererObserver: () => Promise<void> = stopRenderer;
    stopRenderer = createAutoMovieResourceRetirement([
      rendererObserver,
      stopMainFrame,
      (): void => {
        opened.page.off("pageerror", pageError);
      },
      (): void => {
        opened.page.off("console", pageConsole);
      },
    ]);
    if (first) props.phase("loading the page");
    await opened.page.goto(props.origin + "/view?resident=1#ao=off", {
      timeout: 0,
      waitUntil: "domcontentloaded",
    });
    // The resident reports its checked generation and renderer text before
    // any document request; that text alone is not hardware proof. Edits invalidate
    // preparation, and a failed candidate waits for the next edit. Both
    // states are reported (phase, compiles in server.log, errors in /health),
    // so the wait is observable rather than bounded by an arbitrary deadline.
    if (first) props.phase("waiting for the first source generation");
    try {
      await opened.page.waitForFunction(
        (): boolean =>
          Boolean(
            (window as unknown as Partial<IHumanViewerWindow>).__humanViewer,
          ),
        undefined,
        { timeout: 0 },
      );
      const actualRenderer: string = await opened.page.evaluate((): string =>
        (window as unknown as IHumanViewerWindow).__humanViewer.renderer(),
      );
      if (closed || resident !== opened) return;
      renderer = actualRenderer;
    } catch (error) {
      // Replaced while it waited: the recovery that replaced it owns readiness.
      if (resident !== opened || recovering === opened) return;
      throw error;
    }
    console.log("RENDERER", renderer);
    announceFirstReady();
  }

  /**
   * The page's renderer exited (a V8 out-of-memory error, a GPU process loss or a kill) or its whole browser went away. Captures and admissions are refused as starting while the page is replaced in this process: the failed Page's public close must fulfill before logical capture ownership is released and renewed; a rejected close retains unknown ownership and refuses replacement and a new page opens on the same browser, or, when that browser cannot open one, in a newly launched browser. Only a replacement that cannot open even in a new browser makes the failure permanent, with that cause. A report about a page already replaced is ignored.
   */
  function recoverResidentPage(
    failed: IHumanViewerResidentPage,
    cause: string,
    physicalSettled: boolean,
  ): void {
    // One exit raises several reports (crash, detach, destroy): the first one
    // recovers, the rest are ignored.
    if (closed || failed !== resident || recovering === failed) return;
    recovering = failed;
    errors = [cause];
    readyRevision = "";
    pageWait = `the renderer exited at ${new Date().toISOString()} (${cause}); the page is being opened again`;
    console.error(
      `PAGE FAILED ${new Date().toISOString()} ${cause}` +
        (physicalSettled ? "" : " (renderer may still be running)") +
        "; opening the page again",
    );
    props.lifetime.fail(new Error(cause), physicalSettled);
    props.publish();
    const stopFailed: () => Promise<void> = stopRenderer;
    void (async (): Promise<void> => {
      // A hung observer cannot skip asking the page to close. Only the page's
      // public completion permits dispatch renewal; it is not kernel proof.
      const closingPage: Promise<void> = Promise.resolve().then(
        (): Promise<void> => failed.page.close(),
      );
      void Promise.resolve()
        .then((): Promise<void> => stopFailed())
        .catch((error: unknown): void => {
          console.error("FAILED PAGE OBSERVER RETIREMENT", error);
        });
      await closingPage;
      // Public Page close completed; release logical holds without claiming kernel exit.
      props.lifetime.fail(new Error(cause), true);
      props.lifetime.renew();
      ++relaunches;
      try {
        await openResidentPage(false, false);
      } catch (error) {
        // The browser itself is gone or going (a killed browser process closes
        // every page before it reports the disconnect): launch a new one.
        console.error(
          `BROWSER RELAUNCH ${new Date().toISOString()} the page could not open on the old browser: ` +
            (error instanceof Error ? error.message : String(error)),
        );
        await openResidentPage(false, true);
      }
      console.log(
        `PAGE RELAUNCHED ${new Date().toISOString()} (${relaunches} since start)`,
      );
    })().catch((error: unknown): void => {
      if (closed) return;
      pageFailure =
        "the resident page could not retire or open again after its reported renderer failure: " +
        (error instanceof Error ? error.message : String(error));
      console.error(`PAGE FAILED ${new Date().toISOString()} ${pageFailure}`);
      props.publish();
    });
  }

  const retire: () => Promise<void> = createAutoMovieResourceRetirement([
    async (): Promise<void> => {
      if (resident !== null) await resident.browser.close();
    },
    (): Promise<void> => stopRenderer(),
  ]);

  return {
    get page(): Page {
      return page;
    },
    get renderer(): string {
      return renderer;
    },
    get errors(): string[] {
      return displayError === undefined ? errors : [...errors, displayError];
    },
    get readyRevision(): string {
      return readyRevision;
    },
    get pageRevision(): string {
      return pageRevision;
    },
    get pageFailure(): string | null {
      return pageFailure;
    },
    get pageWait(): string | null {
      return pageWait;
    },
    get work(): HumanViewerWork | null {
      return work;
    },
    get relaunches(): number {
      return relaunches;
    },
    firstReady,
    open: (): Promise<void> => openResidentPage(true, false),
    readHeap: (): Promise<IHumanViewerHeapUsage> => readHeap(),
    readLiveHeap: (): Promise<IHumanViewerHeapUsage> => readLiveHeap(),
    readWorkerHeaps: (collect: boolean): Promise<IHumanViewerWorkerHeap[]> =>
      resident === null
        ? Promise.resolve([])
        : readHumanViewerWorkerHeaps(resident.browser, collect),
    error: (error: unknown): void => {
      errors.push(error instanceof Error ? error.message : String(error));
    },
    close: (): Promise<void> => {
      closed = true;
      return retire();
    },
  };
}
