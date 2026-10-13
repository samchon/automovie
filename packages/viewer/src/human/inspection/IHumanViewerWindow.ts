import type { HumanViewerHandle } from "./HumanViewerHandle.js";

/**
 * A viewer page's window as the host page, the server and the capture reader see it: the observation handle the page publishes once a generation is ready.
 *
 * @evidence contracts/common.md#principled-implementation The page publishes its observation handle only after a source generation has reached readiness.
 * @evidence contracts/common.md#clear-and-simple-design One window property exposes the existing handle to host and server readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The window record transports the handle and contains no alternate numerical or rendering implementation.
 * @evidence contracts/common.md#meaningful-documentation Documents the observation handle's publication condition on the viewer page.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor The page publishes its observation handle only after a source generation has reached readiness.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view One window property exposes the existing handle to host and server readers.
 * @author Samchon
 */
export interface IHumanViewerWindow {
  /**
   * The page's observation handle, published when its generation is ready.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor The page's observation handle, published when its generation is ready. The page publishes its observation handle only after a source generation has reached readiness.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view The page's observation handle, published when its generation is ready. One window property exposes the existing handle to host and server readers.
   */
  __humanViewer: HumanViewerHandle;
}
