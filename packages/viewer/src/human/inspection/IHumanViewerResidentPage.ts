import type { Browser, Page } from "playwright";

import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";

/**
 * The resident Chromium page and the heap readers bound to its own session.
 *
 * @evidence contracts/common.md#principled-implementation Browser and page handles identify one renderer session whose heap readers account for that page's own isolate.
 * @evidence contracts/common.md#clear-and-simple-design The resident page record groups session handles with ordinary and collected heap reads rather than global browser state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A page heap measurement is an explicit borrowed operation and supplies no guessed worker-isolate usage.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the launched browser and capture page from uncollected and live-heap readers.
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Browser and page handles identify one renderer session whose heap readers account for that page's own isolate.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation The resident page record groups session handles with ordinary and collected heap reads rather than global browser state.
 * @author Samchon
 */
export interface IHumanViewerResidentPage {
  /**
   * The launched browser.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle The launched browser. Browser and page handles identify one renderer session whose heap readers account for that page's own isolate.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation The launched browser. The resident page record groups session handles with ordinary and collected heap reads rather than global browser state.
   */
  browser: Browser;

  /**
   * The one page that draws every capture.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle The one page that draws every capture. Browser and page handles identify one renderer session whose heap readers account for that page's own isolate.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation The one page that draws every capture. The resident page record groups session handles with ordinary and collected heap reads rather than global browser state.
   */
  page: Page;

  /**
   * Read the page's heap, live objects and garbage alike.
   *
   * @evidence contracts/common.md#principled-implementation The heap reader returns this page isolate's current usage before collection.
   * @evidence contracts/common.md#clear-and-simple-design Measurement stays with the launched page session while consumers receive a typed heap result.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uncollected garbage remains part of the reading instead of being silently subtracted or guessed.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes ordinary page heap reading from the separate garbage-collected operation.
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle The heap reader returns this page isolate's current usage before collection.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Measurement stays with the launched page session while consumers receive a typed heap result.
   */
  readHeap: () => Promise<IHumanViewerHeapUsage>;

  /**
   * Collect the page's garbage, then read its heap.
   *
   * @evidence contracts/common.md#principled-implementation The live reader first collects this page's garbage and then returns its isolate usage.
   * @evidence contracts/common.md#clear-and-simple-design One session-bound operation owns the collection/read ordering.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A page live-heap reading does not substitute estimated worker heaps or readiness.
   * @evidence contracts/common.md#meaningful-documentation States the explicit garbage-collection step before page heap measurement.
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle The live reader first collects this page's garbage and then returns its isolate usage.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation One session-bound operation owns the collection/read ordering.
   */
  readLiveHeap: () => Promise<IHumanViewerHeapUsage>;
}
