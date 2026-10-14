import type { HumanViewerHandle } from "./HumanViewerHandle.js";

/**
 * A viewer page's window as the host page, the server and the capture reader see it: the observation handle the page publishes once a generation is ready.
 *
 * @evidence contracts/common.md#principled-implementation The browser window exposes its observation handle only after a source generation has prepared the actual renderer and display authority.
 * @evidence contracts/common.md#clear-and-simple-design A single named handle is shared by the host page, server and capture reader instead of parallel private readiness channels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Handle publication represents the product's ready generation rather than a build-success or page-load fixture signal.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies the consumers and the ready-generation publication boundary for __humanViewer.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The window projection chooses no generation preparation or renderer admission algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The handle is live page state; its presence alone does not establish cache equivalence across source-generation replacements.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page owns the published observation handle and withdraws it with its generation; server callers borrow it for current requests.
 *
 * @author Samchon
 */
export interface IHumanViewerWindow {
  /** The page's observation handle, published when its generation is ready. */
  __humanViewer: HumanViewerHandle;
}
