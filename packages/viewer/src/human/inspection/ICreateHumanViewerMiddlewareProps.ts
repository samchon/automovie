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
 * @author Samchon
 */
export interface ICreateHumanViewerMiddlewareProps {
  /** Revision notifications that never command a page reload. */
  sourceEvents: ReturnType<typeof createHumanViewerSourceEvents>;

  /** Application HTML delivered without the development reload client. */
  pages: ReturnType<typeof serveHumanViewerPages>;

  /** Selected service origin used to parse relative requests. */
  origin: string;

  /** Live health from its existing state owners. */
  health: () => ReturnType<typeof assembleHumanViewerHealth>;

  /** Source-window authority. */
  generation: Omit<IServeHumanViewerGenerationProps, "url" | "response" | "json">;

  /** Independent heap readings. */
  heap: Omit<IServeHumanViewerHeapProps, "response" | "json">;

  /** Fresh complete catalogue and input authority at request time. */
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
