/**
 * Browser-root target events remain observable when a resident renderer dies
 * inside JavaScript before its page session can answer an outstanding call.
 */
import type { Browser, Page } from "playwright";

/**
 * Correlate terminal signals with the exact owned page, and detach only this
 * observer on disposal. A browser transport disconnect withdraws readiness
 * but is not evidence that its renderer has physically stopped.
 *
 * @evidence contracts/common.md#principled-implementation Browser-root crash/destruction signals identify the owned target independently of its stalled renderer session.
 * @evidence contracts/common.md#clear-and-simple-design One observer owns the failure listeners and their removal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unrelated targets, session detach and elapsed time do not release capture ownership.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes renderer settlement from transport loss and defines observer disposal.
 */
export async function observeHumanViewerRendererTarget(options: {
  browser: Pick<Browser, "newBrowserCDPSession" | "on" | "off" | "isConnected">;
  page: Pick<Page, "context" | "on" | "off">;
  failed: (cause: string, physicalSettled: boolean) => void;
}): Promise<() => Promise<void>> {
  const probe = await options.page.context().newCDPSession(options.page as Page);
  let targetId: string;
  try {
    const info = await probe.send("Target.getTargetInfo");
    targetId = info.targetInfo.targetId;
  } finally {
    await probe.detach();
  }
  const root = await options.browser.newBrowserCDPSession();
  const crashed = (event: { targetId: string }): void => {
    if (event.targetId === targetId)
      options.failed("Resident GPU renderer crashed", true);
  };
  const destroyed = (event: { targetId: string }): void => {
    if (event.targetId === targetId)
      options.failed("Resident GPU renderer destroyed", true);
  };
  const pageCrash = (): void => options.failed("Resident GPU page crashed", true);
  const pageClose = (): void => options.failed("Resident GPU page closed", options.browser.isConnected());
  const disconnected = (): void => options.failed("Resident GPU browser disconnected", false);
  const remove = (): void => {
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
    throw error;
  }
  return async () => {
    remove();
    if (options.browser.isConnected()) await root.detach();
  };
}
