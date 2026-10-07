import type { Page } from "playwright";

import type { HumanViewerWork } from "./HumanViewerWork";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage";
import type { IHumanViewerResidentPage } from "./IHumanViewerResidentPage";
import type { IHumanViewerWindow } from "./IHumanViewerWindow";
import type { ICreateHumanViewerResidencyProps } from "./ICreateHumanViewerResidencyProps";
import { launchHumanViewerPage } from "./launchHumanViewerPage";
import { observeHumanViewerRendererTarget } from "./observeHumanViewerRendererTarget";
import { readHumanViewerWork } from "./readHumanViewerWork";
import { readHumanViewerWorkerHeaps } from "./readHumanViewerWorkerHeaps";
import { routeHumanViewerConsole } from "./routeHumanViewerConsole";
import { watchHumanViewerMainFrame } from "./watchHumanViewerMainFrame";

/**
 * Own the resident browser, mutable frame identity and renderer recovery. A
 * replacement releases the failed capture lifetime before renewing it; readiness
 * belongs to whichever opening actually reaches a live source generation.
 * Heap readers always follow that same resident page and browser.
 *
 * @evidence contracts/common.md#principled-implementation Physical renderer settlement and current page identity preserve capture ownership during recovery.
 * @evidence contracts/common.md#clear-and-simple-design Browser state, heap sessions, console observers and replacement share one resource lifetime.
 * @evidence contracts/common.md#meaningful-documentation States replacement readiness, capture cancellation and heap ownership.
 */
export function createHumanViewerResidency(
  props: ICreateHumanViewerResidencyProps,
) {
  let page: Page;
  let renderer = "";
  let errors: string[] = [];
  /**
   * The revision the ready generation's code is: its window's proven label, or
   * `unproven <page revision>` when the code could not be proven to be any
   * revision, which never equals a current revision, so its frames are stale.
   */
  let readyRevision = "";
  /** The catalogue revision the ready page reports, for the capture identity check. */
  let pageRevision = "";
  /** Why the page failed for good, or null while it can still draw. */
  let pageFailure: string | null = null;
  /** What a reloaded page waits for, or null when it never reloaded since its last generation. */
  let pageWait: string | null = null;
  let work: HumanViewerWork | null = null;
  /** Heap readings of the resident page; the readers are bound once the page exists. */
  let readHeap: () => Promise<IHumanViewerHeapUsage> = () =>
    Promise.reject(new Error("No page yet"));
  let readLiveHeap: () => Promise<IHumanViewerHeapUsage> = () =>
    Promise.reject(new Error("No page yet"));
  /** The open page, its browser and heap readers; null before the first one opens. */
  let resident: IHumanViewerResidentPage | null = null;
  /** Detach the current page's renderer observer. */
  let stopRenderer = async (): Promise<void> => {};
  /** Pages opened again after their renderer exited, for /health. */
  let relaunches = 0;
  /** The failed page being replaced, so repeated reports of one exit recover once. */
  let recovering: IHumanViewerResidentPage | null = null;

  /** Resolves once the first page of this server is ready, whichever opening made it so. */
  let announceFirstReady: () => void = () => {};
  const firstReady = new Promise<undefined>((resolve) => {
    announceFirstReady = () => resolve(undefined);
  });

  /**
   * Open the resident page and wait for its first source generation. A fresh
   * browser is launched when asked or when the current one is gone; otherwise
   * the connected browser is reused. The first opening reports startup phases;
   * a replacement reports through `pageWait`. Every page gets the same
   * observers, so a replacement fails, reloads and reports exactly as the first
   * one did. A page that fails while it waits is left to the recovery that
   * replaces it: its opening returns without error, since it is no longer the
   * page the server serves.
   */
  async function openResidentPage(
    first: boolean,
    freshBrowser: boolean,
  ): Promise<void> {
    if (freshBrowser) await resident?.browser.close().catch(() => undefined);
    const opened = await launchHumanViewerPage(
      freshBrowser ? undefined : resident?.browser,
    );
    resident = opened;
    page = opened.page;
    readHeap = opened.readHeap;
    readLiveHeap = opened.readLiveHeap;
    stopRenderer = await observeHumanViewerRendererTarget({
      browser: opened.browser,
      page: opened.page,
      failed: (cause, physicalSettled) =>
        recoverResidentPage(opened, cause, physicalSettled),
    });
    // A Vite full reload replaces the host page and its committed generation:
    // until a new generation is ready nothing can draw, which captures and
    // admissions report instead of waiting on a page that lost its handle.
    watchHumanViewerMainFrame(opened.page, () => {
      if (readyRevision === "") return;
      readyRevision = "";
      // The reloaded page's candidates opened their holds over requests the
      // reload ended; the windows close with them, never proven.
      pageWait = `the page reloaded at ${new Date().toISOString()}; waiting for a source generation`;
      console.log("PAGE RELOADED " + pageWait);
      props.publish();
    });
    opened.page.on("pageerror", (error) => {
      errors.push(error.message);
      console.error(error.message);
    });
    opened.page.on("console", (message) =>
      routeHumanViewerConsole(message.text(), {
        work: (text) => {
          work = readHumanViewerWork(text);
          if (work?.completed !== undefined)
            console.log("NUMERICAL STAGE " + JSON.stringify(work));
          props.progress();
          if (work !== null) props.sample(work);
        },
        error: (cause) => {
          errors = [cause];
        },
        ready: (line) => {
          const [revision, label] = line.split(" ");
          errors = [];
          pageRevision = revision;
          readyRevision =
            label === undefined || label === "-" ? "unproven " + revision : label;
          pageWait = null;
          console.log(
            `GENERATION READY ${new Date().toISOString()} ${readyRevision.slice(0, 21)}` +
              (readyRevision === props.inventory().revision ? " (current)" : " (stale)"),
          );
          // Only code proven to be the current revision warms thumbnails.
          if (readyRevision === props.inventory().revision)
            props.sourceReady(readyRevision);
          // A ready generation can admit the inputs still pending.
          props.retryAdmissions("generation " + revision.slice(0, 12) + " ready");
        },
        admission: () => props.retryAdmissions("a viewer frame loaded"),
        restart: (reason) =>
          console.log(`CANDIDATE RESTART ${new Date().toISOString()} ${reason}`),
        firstAddress: (reason) =>
          console.log(
            `CANDIDATE FIRST ADDRESS ${new Date().toISOString()} ${reason}`,
          ),
        cache: (text) =>
          console.log(`NUMERICAL CACHE ${new Date().toISOString()} ${text}`),
      }),
    );
    if (first) props.phase("loading the page");
    await opened.page.goto(props.origin + "/view?resident=1#ao=off", {
      timeout: 600000,
      waitUntil: "domcontentloaded",
    });
    // The first generation needs the whole human package compiled and the
    // standard document drawn; while source edits keep invalidating compiles
    // it cannot finish, and a failed candidate waits for the next edit. Both
    // states are reported (phase, compiles in server.log, errors in /health),
    // so the wait is observable rather than bounded by an arbitrary deadline.
    if (first) props.phase("waiting for the first source generation");
    try {
      await opened.page.waitForFunction(
        () =>
          Boolean(
            (window as unknown as Partial<IHumanViewerWindow>).__humanViewer,
          ),
        undefined,
        { timeout: 0 },
      );
      renderer = await opened.page.evaluate(() =>
        (window as unknown as IHumanViewerWindow).__humanViewer.renderer(),
      );
    } catch (error) {
      // Replaced while it waited: the recovery that replaced it owns readiness.
      if (resident !== opened || recovering === opened) return;
      throw error;
    }
    console.log("RENDERER", renderer);
    announceFirstReady();
  }

  /**
   * The page's renderer exited (a V8 out-of-memory error, a GPU process loss or
   * a kill) or its whole browser went away. Captures and admissions are refused
   * as starting while the page is replaced in this process: the failed page is
   * closed, which releases every capture it held, the capture lifetime is
   * renewed and a new page opens on the same browser, or, when that browser
   * cannot open one, in a newly launched browser. Only a replacement that
   * cannot open even in a new browser makes the failure permanent, with that
   * cause. A report about a page already replaced is ignored.
   */
  function recoverResidentPage(
    failed: IHumanViewerResidentPage,
    cause: string,
    physicalSettled: boolean,
  ): void {
    // One exit raises several reports (crash, detach, destroy): the first one
    // recovers, the rest are ignored.
    if (failed !== resident || recovering === failed) return;
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
    const stopFailed = stopRenderer;
    void (async () => {
      // The dead page's observer and page are cleaned up beside the recovery,
      // never before it: detaching from a crashed target was seen to never
      // settle, which left the server refusing every capture for good.
      void Promise.allSettled([stopFailed(), failed.page.close()]);
      // The dead renderer cannot finish any capture: release them all.
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
    })().catch((error: unknown) => {
      pageFailure =
        "the page could not be opened again after its renderer exited, even in a new browser: " +
        (error instanceof Error ? error.message : String(error));
      console.error(`PAGE FAILED ${new Date().toISOString()} ${pageFailure}`);
      props.publish();
    });
  }

  return {
    get page() {
      return page;
    },
    get renderer() {
      return renderer;
    },
    get errors() {
      return errors;
    },
    get readyRevision() {
      return readyRevision;
    },
    get pageRevision() {
      return pageRevision;
    },
    get pageFailure() {
      return pageFailure;
    },
    get pageWait() {
      return pageWait;
    },
    get work() {
      return work;
    },
    get relaunches() {
      return relaunches;
    },
    firstReady,
    open: () => openResidentPage(true, false),
    readHeap: () => readHeap(),
    readLiveHeap: () => readLiveHeap(),
    readWorkerHeaps: (collect: boolean) =>
      resident === null
        ? Promise.resolve([])
        : readHumanViewerWorkerHeaps(resident.browser, collect),
    stalled: (cause: string): void => {
      if (resident !== null) recoverResidentPage(resident, cause, true);
    },
    error: (error: unknown): void => {
      errors.push(error instanceof Error ? error.message : String(error));
    },
    close: async (): Promise<void> => {
      await resident?.browser.close();
      await stopRenderer();
    },
  };
}
