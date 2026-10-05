/**
 * Browser-root target events remain observable when a resident renderer dies
 * inside JavaScript before its page session can answer an outstanding call.
 */
import type { Page } from "playwright";

import type { IHumanViewerInspectorDetached } from "./IHumanViewerInspectorDetached";
import type { IHumanViewerRendererTargetOptions } from "./IHumanViewerRendererTargetOptions";
import type { IHumanViewerTargetEvent } from "./IHumanViewerTargetEvent";

/**
 * The detach reason Chromium gives when the renderer process behind a session
 * has exited. Any other detach reason only means the session was taken away,
 * which does not prove the renderer stopped.
 */
const RENDER_PROCESS_GONE = "Render process gone.";

/**
 * Correlate terminal signals with the exact owned page, and detach only this
 * observer on disposal. A page-session detach whose reason says the render
 * process is gone is a physical stop; any other detach of this observer's
 * own session is not a failure. A closed page or browser connection is
 * terminal for this page: every later capture is refused with the cause, so
 * the capture it interrupted is released instead of holding the queue.
 *
 * @evidence contracts/common.md#principled-implementation Browser-root crash/destruction signals identify the owned target independently of its stalled renderer session.
 * @evidence contracts/common.md#clear-and-simple-design One observer owns the failure listeners and their removal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unrelated targets, an observer-only session detach and elapsed time do not release capture ownership.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes renderer settlement from transport loss and defines observer disposal.
 */
export async function observeHumanViewerRendererTarget(
  options: IHumanViewerRendererTargetOptions,
): Promise<() => Promise<void>> {
  // The page's own session stays open with the Inspector domain enabled.
  // Chromium has two renderer-exit reports for a session: `targetCrashed`
  // and `detached` with the reason "Render process gone.". Playwright reads
  // only the first; a resident renderer that died of a V8 out-of-memory
  // error was seen to produce no crash event at all, so both are observed.
  const session = await options.page.context().newCDPSession(options.page as Page);
  const info = await session.send("Target.getTargetInfo");
  const targetId = info.targetInfo.targetId;
  /** Whether the page's renderer was reported gone; its session then never answers a detach. */
  let gone = false;
  const failed = (cause: string, physicalSettled: boolean): void => {
    gone = true;
    options.failed(cause, physicalSettled);
  };
  // Another detach reason only takes this observer's session away; the page
  // and Playwright's own session may still be serving, so it is not a failure.
  const inspectorDetached = (event: IHumanViewerInspectorDetached): void => {
    if (event.reason === RENDER_PROCESS_GONE)
      failed("Resident GPU renderer exited (" + event.reason + ")", true);
  };
  const inspectorCrashed = (): void => failed("Resident GPU renderer crashed", true);
  session.on("Inspector.detached", inspectorDetached);
  session.on("Inspector.targetCrashed", inspectorCrashed);
  await session.send("Inspector.enable");
  const root = await options.browser.newBrowserCDPSession();
  const crashed = (event: IHumanViewerTargetEvent): void => {
    if (event.targetId === targetId)
      failed("Resident GPU renderer crashed", true);
  };
  const destroyed = (event: IHumanViewerTargetEvent): void => {
    if (event.targetId === targetId)
      failed("Resident GPU renderer destroyed", true);
  };
  const pageCrash = (): void => failed("Resident GPU page crashed", true);
  const pageClose = (): void => failed("Resident GPU page closed", true);
  // A launched browser whose connection closed can never answer this page
  // again, and the failure is permanent, so no later capture can share the
  // page with work the lost renderer might still be finishing: releasing the
  // dispatched capture is safe, and holding it would block the queue forever.
  const disconnected = (): void => failed("Resident GPU browser disconnected", true);
  const remove = (): void => {
    session.off("Inspector.detached", inspectorDetached);
    session.off("Inspector.targetCrashed", inspectorCrashed);
    root.off("Target.targetCrashed", crashed);
    root.off("Target.targetDestroyed", destroyed);
    options.page.off("crash", pageCrash);
    options.page.off("close", pageClose);
    options.browser.off("disconnected", disconnected);
  };
  root.on("Target.targetCrashed", crashed);
  root.on("Target.targetDestroyed", destroyed);
  options.page.on("crash", pageCrash);
  options.page.on("close", pageClose);
  options.browser.on("disconnected", disconnected);
  try {
    await root.send("Target.setDiscoverTargets", { discover: true });
  } catch (error) {
    remove();
    await root.detach();
    await session.detach().catch(() => undefined);
    throw error;
  }
  return async () => {
    remove();
    if (!options.browser.isConnected()) return;
    await root.detach();
    // A session whose renderer is gone never answers `detach` (measured: still
    // pending after 20 s, while the browser session detached in 1 ms), so it
    // is left to close with its page.
    if (!gone) await session.detach().catch(() => undefined);
  };
}
