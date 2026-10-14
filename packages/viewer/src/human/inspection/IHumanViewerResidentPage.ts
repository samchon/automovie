import type { Browser, Page } from "playwright";

import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";

/**
 * The resident Chromium page and the heap readers bound to its own session.
 *
 * @evidence contracts/common.md#principled-implementation Browser, page and heap readers are bound to the same launched Chromium session so readings follow the actual resident renderer.
 * @evidence contracts/common.md#clear-and-simple-design The session record groups page access with its ordinary and garbage-collected heap observations without owning capture scheduling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readings come from the actual browser session rather than a heap estimate inferred from resident array counts.
 * @evidence contracts/common.md#meaningful-documentation Comments identify the resident page, launched browser and the distinction between ordinary and post-collection heap readings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The page-session shape selects no heap sampling algorithm; launchHumanViewerPage creates its CDP-backed readers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record stores reader functions, not cached measurements; each call observes that bound session anew.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Residency owns the launched browser, reuses it across ordinary page replacement and awaits closure on a fresh-browser transition or shutdown; this record exposes its page and bound readers without independently measuring native release.
 *
 * @author Samchon
 */
export interface IHumanViewerResidentPage {
  /** The launched browser. */
  browser: Browser;

  /** The one page that draws every capture. */
  page: Page;

  /**
   * Read the page's heap, live objects and garbage alike.
   *
   * @evidence contracts/common.md#principled-implementation The bound reader asks this page's CDP Runtime for heap usage without forcing garbage collection first.
   * @evidence contracts/common.md#clear-and-simple-design Sampling is a separate callback from collection so health reads can observe ordinary heap pressure.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The reported usage comes from the resident page isolate rather than a sum of estimated model arrays.
   * @evidence contracts/common.md#meaningful-documentation The comment explains that both live objects and uncollected garbage contribute to this reading.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback signature chooses no heap traversal; V8 implements Runtime.getHeapUsage.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Ordinary heap readings observe current process state and are not promised to be memoized across calls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The reader borrows the page-bound heap session, whose lifetime ends with the page/browser owned by residency.
   */
  readHeap: () => Promise<IHumanViewerHeapUsage>;

  /**
   * Collect the page's garbage, then read its heap.
   *
   * @evidence contracts/common.md#principled-implementation The live reading awaits HeapProfiler collection before requesting usage from the same page session.
   * @evidence contracts/common.md#clear-and-simple-design Collection and its following measurement are one callback so callers cannot accidentally inspect a different page between them.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Garbage collection does not assert physical GPU release or substitute a target heap number.
   * @evidence contracts/common.md#meaningful-documentation The member states the required collection-before-measurement order.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This operation's signature leaves garbage collection and heap accounting algorithms to V8.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Collection changes isolate state; identical callback arguments do not make two collection effects interchangeable.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The measurement retains no independent browser owner; its CDP capability remains attached to the resident page lifecycle.
   */
  readLiveHeap: () => Promise<IHumanViewerHeapUsage>;
}
