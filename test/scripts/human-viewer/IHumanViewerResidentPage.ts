import type { Browser, Page } from "playwright";

import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage";

/**
 * The resident Chromium page and the heap readers bound to its own session.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface IHumanViewerResidentPage {
  /** The launched browser. */
  browser: Browser;

  /** The one page that draws every capture. */
  page: Page;

  /** Read the page's heap, live objects and garbage alike. */
  readHeap: () => Promise<IHumanViewerHeapUsage>;

  /** Collect the page's garbage, then read its heap. */
  readLiveHeap: () => Promise<IHumanViewerHeapUsage>;
}
