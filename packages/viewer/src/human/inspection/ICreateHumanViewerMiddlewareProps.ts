import type { IServeHumanViewerCaptureProps } from "./IServeHumanViewerCaptureProps.js";
import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps.js";
import type { IServeHumanViewerGenerationProps } from "./IServeHumanViewerGenerationProps.js";
import type { IServeHumanViewerHeapProps } from "./IServeHumanViewerHeapProps.js";
import type { assembleHumanViewerHealth } from "./assembleHumanViewerHealth.js";
import type { createHumanViewerNodeService } from "./createHumanViewerNodeService.js";
import type { serveHumanViewerDisplay } from "./serveHumanViewerDisplay.js";
import type { createHumanViewerSourceEvents } from "./createHumanViewerSourceEvents.js";
import type { serveHumanViewerPages } from "./serveHumanViewerPages.js";

/**
 * Request-independent host bindings for the loopback HTTP routes.
 *
 * @evidence contracts/common.md#principled-implementation Route bindings preserve the existing source, numerical, capture and display owners under the selected loopback origin.
 * @evidence contracts/common.md#clear-and-simple-design Request-independent authorities are supplied once; request fields remain with each HTTP route.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Application pages and revision events are explicit transports that do not rely on injected automatic reload behavior.
 * @evidence contracts/common.md#meaningful-documentation Member descriptions distinguish revision notification, raw HTML, request-time state and physical capture lifetime.
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
   * @evidence contracts/common.md#principled-implementation The HTTP dispatcher asks existing state owners for live health at request time.
   * @evidence contracts/common.md#clear-and-simple-design One accessor supplies the complete assembled health projection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts HTTP availability cannot replace actual renderer or source readiness readings.
   * @evidence contracts/common.md#meaningful-documentation The callback returns the existing health assembly without owning its state.
   */
  health: () => ReturnType<typeof assembleHumanViewerHealth>;

  /** Source-window authority. */
  generation: Omit<IServeHumanViewerGenerationProps, "url" | "response" | "json">;

  /** Independent heap readings. */
  heap: Omit<IServeHumanViewerHeapProps, "response" | "json">;

  /**
   * Fresh complete catalogue and input authority at request time.
   *
   * @evidence contracts/common.md#principled-implementation Request-time data bindings use the host's latest complete catalogue and source authority.
   * @evidence contracts/common.md#clear-and-simple-design The accessor excludes per-request URL, request, response and JSON-writing fields.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale construction-time catalogue cannot be substituted for the live data-route bindings.
   * @evidence contracts/common.md#meaningful-documentation The result supplies data authority only; each request contributes its own transport objects.
   */
  data: () => Omit<IServeHumanViewerDataProps, "url" | "request" | "response" | "json">;

  /** Existing serialized GPU capture authority. */
  capture: Omit<IServeHumanViewerCaptureProps, "url" | "request" | "response" | "json">;

  /** Checked Node numerical sessions, separate from GPU rendering. */
  numerical: ReturnType<typeof createHumanViewerNodeService>;

  /**
   * Publication of completed interactive displays, independent of resident captures.
   */
  display: ReturnType<typeof serveHumanViewerDisplay>;
}
