import type { IServeHumanViewerCaptureProps } from "./IServeHumanViewerCaptureProps.js";
import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps.js";
import type { IServeHumanViewerGenerationProps } from "./IServeHumanViewerGenerationProps.js";
import type { IServeHumanViewerHeapProps } from "./IServeHumanViewerHeapProps.js";
import type { assembleHumanViewerHealth } from "./assembleHumanViewerHealth.js";
import type { createHumanViewerNodeService } from "./createHumanViewerNodeService.js";
import type { createHumanViewerSourceEvents } from "./createHumanViewerSourceEvents.js";
import type { serveHumanViewerDisplay } from "./serveHumanViewerDisplay.js";
import type { serveHumanViewerPages } from "./serveHumanViewerPages.js";

/**
 * Request-independent host bindings for the loopback HTTP routes.
 *
 * @evidence contracts/common.md#principled-implementation The loopback middleware delegates fixed route families to their existing source, numerical, capture, heap and display owners.
 * @evidence contracts/common.md#clear-and-simple-design Request-independent handles stay here while each route receives its request URL/body/response and fresh data where required.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Health is state reporting, not hardware display proof; numerical service and GPU capture remain distinct authorities without alternate test routes.
 * @evidence contracts/common.md#meaningful-documentation Documents live callbacks, selected origin and borrowed services; published interactive displays remain separate from serialized resident captures.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type erases; middleware checks a fixed route order, and each selected handler owns its input parsing and domain work.
 * @evidence contracts/performance.md#reuse-equivalent-work Service handles are reused across requests; health and data are reread because source, page availability and inventory can change independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The server owns all supplied service lifetimes; this binding record retains references but launches no browser, worker, renderer or watcher.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerMiddlewareProps {
  /** Revision notifications that never command a page reload. */
  sourceEvents: ReturnType<typeof createHumanViewerSourceEvents>;

  /** Application HTML delivered without the development reload client. */
  pages: ReturnType<typeof serveHumanViewerPages>;

  /** Selected service origin used to parse relative requests. */
  origin: string;

  /**
   * Live health from its existing state owners.
   *
   * @evidence contracts/common.md#principled-implementation Assembles current observations from existing source/page/queue/heap owners when the health route is requested.
   * @evidence contracts/common.md#clear-and-simple-design Keeps status aggregation with assembleHumanViewerHealth rather than copying state into middleware at installation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A healthy status is not actual image inspection or an independent hardware measurement; original failures remain visible through their owners.
   * @evidence contracts/common.md#meaningful-documentation The callback supplies fresh aggregate status per health request, including source/readiness facts rather than a startup-only snapshot.
   * @evidence contracts/performance.md#efficient-algorithms Aggregation cost follows the status owners and their reported populations; fixed route selection adds no model scan.
   * @evidence contracts/performance.md#reuse-equivalent-work Existing state owners reuse their measurements, but the middleware invokes the callback for each request to avoid stale combined status.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned status contains reported values, not ownership transfer of browser or resident resources; the server retains the service handles.
   */
  health: () => ReturnType<typeof assembleHumanViewerHealth>;

  /** Source-window authority. */
  generation: Omit<
    IServeHumanViewerGenerationProps,
    "url" | "response" | "json"
  >;

  /** Independent heap readings. */
  heap: Omit<IServeHumanViewerHeapProps, "response" | "json">;

  /**
   * Fresh complete catalogue and input authority at request time.
   *
   * @evidence contracts/common.md#principled-implementation Provides current catalogue and input authority to the data handler at request time, leaving URL/body/response fields request-owned.
   * @evidence contracts/common.md#clear-and-simple-design The Omit separates fresh shared state from per-request transport without adding a second source reader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A fixed installation-time catalogue would become stale; the callback supplies current authority and retains the data handler's admission rules.
   * @evidence contracts/common.md#meaningful-documentation Documents that the complete catalogue and input authority are read anew for each data request, with source ownership unchanged.
   * @evidence contracts/performance.md#efficient-algorithms Callback cost depends on its source state reads; request parsing, catalogue encoding and authority checks belong to serveHumanViewerData.
   * @evidence contracts/performance.md#reuse-equivalent-work Source/controller state is reused by the host, while this callback refreshes the request binding rather than caching equal URLs as responses.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The handler borrows returned state for its request; the server owns source/watchers and the callback creates no independently retained document store.
   */
  data: () => Omit<
    IServeHumanViewerDataProps,
    "url" | "request" | "response" | "json"
  >;

  /** Existing serialized GPU capture authority. */
  capture: Omit<
    IServeHumanViewerCaptureProps,
    "url" | "request" | "response" | "json"
  >;

  /** Checked Node numerical sessions, separate from GPU rendering. */
  numerical: ReturnType<typeof createHumanViewerNodeService>;

  /**
   * Publication of completed interactive displays, independent of resident captures.
   */
  display: ReturnType<typeof serveHumanViewerDisplay>;
}
