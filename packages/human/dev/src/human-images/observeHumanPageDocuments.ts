import type { CDPSession, Page } from "playwright-core";

import type { HumanImageProcessTrace } from "./HumanImageProcessTrace.ts";

/** Observe actual Chromium documents separately from history URL changes.
 *
 * @param page Existing process-owned Chromium page.
 * @param trace Existing bounded memory IPC sink.
 * @param changed Receives a new epoch only for a main-frame new-document event or closed target.
 * @evidence contracts/common.md#principled-implementation The public CDPSession subscribes to Page.frameNavigated and Page.navigatedWithinDocument separately; only the former changes document ownership, while the latter preserves the current epoch.
 * @evidence contracts/common.md#clear-and-simple-design One observer gives the existing worker its document epoch without changing viewer URL synchronization or capture APIs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no Playwright internals, URL-equality heuristic, injected page global or synthetic navigation; actual event metadata is bounded before logging.
 * @evidence contracts/common.md#meaningful-documentation States document versus history semantics and page-owned observation lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Fixed work per top-frame event; no polling or model traversal occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work The same CDP session observes this worker's one resident page for all model keys.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One attached session and three listeners live with the page; target close detaches the session, invalidates the epoch and prevents later successful ownership checks.
 */
export async function observeHumanPageDocuments(
  page: Page,
  trace: HumanImageProcessTrace,
  changed: (epoch: number) => void,
): Promise<void> {
  const session: CDPSession = await page.context().newCDPSession(page);
  let epoch: number = 0;
  let mainFrame: string | undefined;
  session.on(
    "Page.frameNavigated",
    (event: {
      frame: { id: string; parentId?: string; loaderId: string; url: string };
    }): void => {
      if (event.frame.parentId) return;
      mainFrame = event.frame.id;
      changed(++epoch);
      trace.document(
        "document.navigation",
        mainFrame,
        event.frame.loaderId,
        event.frame.url,
      );
    },
  );
  session.on(
    "Page.navigatedWithinDocument",
    (event: {
      frameId: string;
      url: string;
      navigationType?: string;
    }): void => {
      if (event.frameId === mainFrame)
        trace.document("document.history", event.frameId, null, event.url);
    },
  );
  session.once("close", (): void => {
    changed(++epoch);
    trace.document("document.closed", mainFrame ?? null, null, null);
  });
  try {
    await session.send("Page.enable");
  } catch (error: unknown) {
    await session.detach().catch((): void => {});
    throw error;
  }
}
