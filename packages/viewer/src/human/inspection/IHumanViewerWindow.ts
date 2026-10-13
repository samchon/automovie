import type { HumanViewerHandle } from "./HumanViewerHandle.js";

/**
 * A viewer page's window as the host page, the server and the capture reader see it: the observation handle the page publishes once a generation is ready.
 *
 * @author Samchon
 */
export interface IHumanViewerWindow {
  /** The page's observation handle, published when its generation is ready. */
  __humanViewer: HumanViewerHandle;
}
