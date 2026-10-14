import { type Browser, type CDPSession, type Page, chromium } from "playwright";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";
import type { IHumanViewerResidentPage } from "./IHumanViewerResidentPage.js";

/**
 * Launch headless Chromium requesting GPU use through ANGLE and open the one resident page. A browser that is still connected is reused, so a page whose renderer exited is replaced without starting another browser. Heap readings use a CDP session of their own, so they never wait behind capture calls on the page's session. The downstream renderer-text policy can accept a generic fallback; actual hardware and display operation require independent observation. Failed page/session acquisition closes the new page and only a browser acquired by this invocation, preserving cleanup causes.
 *
 * @evidence contracts/common.md#principled-implementation The factory reuses an actually connected supplied browser or launches Chromium, then binds heap reads to a distinct CDP session on the actual created page.
 * @evidence contracts/common.md#clear-and-simple-design Browser selection, one resident page and two bound heap callbacks form the acquisition result without another capture or renderer scheduler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts ANGLE flags are requests rather than proof of hardware, and failed acquisition closes only this new page and an invocation-owned browser rather than a borrowed connected browser.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes browser reuse, separate heap observation, downstream renderer-text admission, independent hardware/display observation and refusal cleanup ownership.
 * @evidence contracts/performance.md#efficient-algorithms Reusing a live browser avoids another process launch, while page/session acquisition and V8 heap collection/reading are delegated to Playwright/CDP.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuse requires the supplied browser still be connected; heap callbacks bind to the same newly opened page rather than another resident's measurement cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Failure independently retires the acquired page and newly launched browser; success transfers browser/page/session lifetime to residency, and page/browser closure owns the CDP heap capability without claiming GPU memory release.
 */
export async function launchHumanViewerPage(
  reuse?: Browser,
): Promise<IHumanViewerResidentPage> {
  const borrowed: boolean = reuse !== undefined && reuse.isConnected();
  const browser: Browser =
    borrowed && reuse !== undefined
      ? reuse
      : await chromium.launch({
          channel: "chromium",
          headless: true,
          args: ["--use-gl=angle", "--ignore-gpu-blocklist"],
        });
  let page: Page | undefined;
  try {
    page = await browser.newPage({
      viewport: { width: 1160, height: 930 },
      deviceScaleFactor: 1,
    });
    const selected: Page = page;
    const heapSession: CDPSession = await selected
      .context()
      .newCDPSession(selected);
    return {
      browser,
      page: selected,
      readHeap: (): Promise<IHumanViewerHeapUsage> =>
        heapSession.send("Runtime.getHeapUsage"),
      readLiveHeap: async (): Promise<IHumanViewerHeapUsage> => {
        await heapSession.send("HeapProfiler.collectGarbage");
        return heapSession.send("Runtime.getHeapUsage");
      },
    };
  } catch (error) {
    return createAutoMovieResourceRetirement(
      [
        async (): Promise<void> => {
          if (page !== undefined) await page.close();
        },
        async (): Promise<void> => {
          if (!borrowed) await browser.close();
        },
      ],
      { error },
    )();
  }
}
