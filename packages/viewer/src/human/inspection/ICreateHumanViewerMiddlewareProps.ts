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
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Route bindings preserve the existing source, numerical, capture and display owners under the selected loopback origin.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Application pages and revision events are explicit transports that do not rely on injected automatic reload behavior.
 * @author Samchon
 */
export interface ICreateHumanViewerMiddlewareProps {
  /**
   * Revision notifications that never command a page reload.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Uses source notifications that preserve the active display instead of requiring an automatic page reload.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Uses source notifications that preserve the active display instead of requiring an automatic page reload.
   */
  sourceEvents: ReturnType<typeof createHumanViewerSourceEvents>;

  /**
   * Application HTML delivered without the development reload client.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Supplies application-owned HTML through the ordinary page transport without injecting a development reload client.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Supplies application-owned HTML through the ordinary page transport without injecting a development reload client.
   */
  pages: ReturnType<typeof serveHumanViewerPages>;

  /**
   * Selected service origin used to parse relative requests.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Uses this service's selected loopback origin when parsing relative inspection requests.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Uses this service's selected loopback origin when parsing relative inspection requests.
   */
  origin: string;

  /**
   * Live health from its existing state owners.
   *
   * @evidence contracts/common.md#principled-implementation The HTTP dispatcher asks existing state owners for live health at request time.
   * @evidence contracts/common.md#clear-and-simple-design One accessor supplies the complete assembled health projection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts HTTP availability cannot replace actual renderer or source readiness readings.
   * @evidence contracts/common.md#meaningful-documentation The callback returns the existing health assembly without owning its state.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The HTTP dispatcher asks existing state owners for live health at request time.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The callback returns the existing health assembly without owning its state.
   */
  health: () => ReturnType<typeof assembleHumanViewerHealth>;

  /**
   * Source-window authority.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Delegates candidate-window labelling to its existing owner while request transport objects are supplied by the route.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Delegates candidate-window labelling to its existing owner while request transport objects are supplied by the route.
   */
  generation: Omit<IServeHumanViewerGenerationProps, "url" | "response" | "json">;

  /**
   * Independent heap readings.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Borrows independent heap readers for resource observation without taking ownership of their sessions.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Borrows independent heap readers for resource observation without taking ownership of their sessions.
   */
  heap: Omit<IServeHumanViewerHeapProps, "response" | "json">;

  /**
   * Fresh complete catalogue and input authority at request time.
   *
   * @evidence contracts/common.md#principled-implementation Request-time data bindings use the host's latest complete catalogue and source authority.
   * @evidence contracts/common.md#clear-and-simple-design The accessor excludes per-request URL, request, response and JSON-writing fields.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale construction-time catalogue cannot be substituted for the live data-route bindings.
   * @evidence contracts/common.md#meaningful-documentation The result supplies data authority only; each request contributes its own transport objects.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Request-time data bindings use the host's latest complete catalogue and source authority.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The result supplies data authority only; each request contributes its own transport objects.
   */
  data: () => Omit<IServeHumanViewerDataProps, "url" | "request" | "response" | "json">;

  /**
   * Existing serialized GPU capture authority.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Uses the existing serialized GPU capture and renderer-lifetime owners for all capture routes.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Uses the existing serialized GPU capture and renderer-lifetime owners for all capture routes.
   */
  capture: Omit<IServeHumanViewerCaptureProps, "url" | "request" | "response" | "json">;

  /**
   * Checked Node numerical sessions, separate from GPU rendering.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Dispatches original numerical requests to the checked Node service rather than a browser-only alternate runtime.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Dispatches original numerical requests to the checked Node service rather than a browser-only alternate runtime.
   */
  numerical: ReturnType<typeof createHumanViewerNodeService>;

  /**
   * Publication of completed interactive displays, independent of resident captures.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Publishes actually completed interactive displays independently of server-driven resident captures.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Publishes actually completed interactive displays independently of server-driven resident captures.
   */
  display: ReturnType<typeof serveHumanViewerDisplay>;
}
