import { chromium } from "playwright";

import type { IHumanViewerResidentPage } from "./IHumanViewerResidentPage";

/**
 * Launch headless Chromium on the real GPU through ANGLE and open the one
 * resident page. Heap readings use a CDP session of their own, so they never
 * wait behind capture calls on the page's session.
 *
 * @evidence contracts/common.md#principled-implementation The GPU flags select the hardware renderer the server verifies afterwards; heap reads do not share the capture session.
 * @evidence contracts/common.md#meaningful-documentation States the renderer flags and the session separation.
 */
export async function launchHumanViewerPage(): Promise<IHumanViewerResidentPage> {
  const browser = await chromium.launch({
    channel: "chromium",
    headless: true,
    args: ["--use-gl=angle", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage({
    viewport: { width: 1160, height: 930 },
    deviceScaleFactor: 1,
  });
  const heapSession = await page.context().newCDPSession(page);
  return {
    browser,
    page,
    readHeap: () => heapSession.send("Runtime.getHeapUsage"),
    readLiveHeap: async () => {
      await heapSession.send("HeapProfiler.collectGarbage");
      return heapSession.send("Runtime.getHeapUsage");
    },
  };
}
