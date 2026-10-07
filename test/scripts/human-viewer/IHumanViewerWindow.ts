import type { HumanViewerHandle } from "./HumanViewerHandle";

/**
 * A viewer page's window as the host page, the server and the capture reader
 * see it: the observation handle the page publishes once a generation is ready.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the published handle and when it exists.
 * @author Samchon
 */
export interface IHumanViewerWindow {
  /** The page's observation handle, published when its generation is ready. */
  __humanViewer: HumanViewerHandle;
}
