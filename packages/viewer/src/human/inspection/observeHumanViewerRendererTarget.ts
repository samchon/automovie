import type { CDPSession, Page } from "playwright";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import type { IHumanViewerInspectorDetached } from "./IHumanViewerInspectorDetached.js";
import type { IHumanViewerRendererTargetOptions } from "./IHumanViewerRendererTargetOptions.js";
import type { IHumanViewerTargetEvent } from "./IHumanViewerTargetEvent.js";

/** Inspector's explicit renderer-exit reason; other detach reasons are not equivalent. */
const RENDER_PROCESS_GONE: string = "Render process gone.";

/**
 * Correlate terminal signals with the exact owned page and detach only this observer on disposal. An explicit process-gone Inspector reason or target crash/destruction reports the renderer stop; another Inspector detach merely withdraws that observer session and is ignored. Page close/browser disconnect are also classified as terminal by the existing capture policy. Connection loss alone is not an independent OS-process termination observation.
 *
 * Partial acquisition and repeated disposal use one retirement completion. A reported unavailable renderer session is left to its page lifetime because its detach was observed to remain pending; browser-root cleanup still runs.
 *
 * @evidence contracts/common.md#principled-implementation Exact target id, Inspector reason and owned page/browser events feed the existing terminal capture policy; unrelated target events and non-process-gone Inspector detach do not report renderer failure.
 * @evidence contracts/common.md#clear-and-simple-design One page CDP session and one browser-root session share named listener callbacks and a joined acquisition/disposal retirement owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generic Inspector detach is not relabeled a renderer stop; page/browser terminal classification is disclosed as capture policy rather than independent OS-process proof.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies event correlation, partial acquisition cleanup, sticky disposal and why unavailable page sessions defer detach to page lifetime.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Fixed event comparisons and listener registration introduce no input-sized scene or process-tree traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated disposal shares the same retirement completion and failures, while target-id correlation prevents another page's event from being reused as this renderer's observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquisition failure and disposal independently remove listeners and attempt root/page-session detach; an unavailable renderer session can remain until page closure, and pending native detach is not certified released.
 */
export async function observeHumanViewerRendererTarget(
  options: IHumanViewerRendererTargetOptions,
): Promise<() => Promise<void>> {
  const session: CDPSession = await options.page.context().newCDPSession(options.page as Page);
  let root: CDPSession | undefined;
  let targetId: string = "";
  let gone: boolean = false;
  const failed: (cause: string, physicalSettled: boolean) => void = (cause: string, physicalSettled: boolean): void => {
    gone = true;
    options.failed(cause, physicalSettled);
  };
  const inspectorDetached: (event: IHumanViewerInspectorDetached) => void = (event: IHumanViewerInspectorDetached): void => {
    if (event.reason === RENDER_PROCESS_GONE)
      failed("Resident GPU renderer exited (" + event.reason + ")", true);
  };
  const inspectorCrashed: () => void = (): void => failed("Resident GPU renderer crashed", true);
  const crashed: (event: IHumanViewerTargetEvent) => void = (event: IHumanViewerTargetEvent): void => {
    if (event.targetId === targetId) failed("Resident GPU renderer crashed", true);
  };
  const destroyed: (event: IHumanViewerTargetEvent) => void = (event: IHumanViewerTargetEvent): void => {
    if (event.targetId === targetId) failed("Resident GPU renderer destroyed", true);
  };
  const pageCrash: () => void = (): void => failed("Resident GPU page crashed", true);
  const pageClose: () => void = (): void => failed("Resident GPU page closed", true);
  const disconnected: () => void = (): void => failed("Resident GPU browser disconnected", true);
  const remove: () => void = (): void => {
    session.off("Inspector.detached", inspectorDetached);
    session.off("Inspector.targetCrashed", inspectorCrashed);
    root?.off("Target.targetCrashed", crashed);
    root?.off("Target.targetDestroyed", destroyed);
    options.page.off("crash", pageCrash);
    options.page.off("close", pageClose);
    options.browser.off("disconnected", disconnected);
  };
  const retire: () => Promise<void> = createAutoMovieResourceRetirement([
    remove,
    async (): Promise<void> => { if (root !== undefined && options.browser.isConnected()) await root.detach(); },
    async (): Promise<void> => { if (!gone && options.browser.isConnected()) await session.detach(); },
  ]);
  try {
    const info: { targetInfo: { targetId: string } } = await session.send("Target.getTargetInfo");
    targetId = info.targetInfo.targetId;
    session.on("Inspector.detached", inspectorDetached);
    session.on("Inspector.targetCrashed", inspectorCrashed);
    await session.send("Inspector.enable");
    root = await options.browser.newBrowserCDPSession();
    root.on("Target.targetCrashed", crashed);
    root.on("Target.targetDestroyed", destroyed);
    options.page.on("crash", pageCrash);
    options.page.on("close", pageClose);
    options.browser.on("disconnected", disconnected);
    await root.send("Target.setDiscoverTargets", { discover: true });
    return retire;
  } catch (error) {
    return createAutoMovieResourceRetirement([retire], { error })();
  }
}
