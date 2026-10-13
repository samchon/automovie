/**
 * The CDP `Inspector.detached` event payload the renderer observer reads.
 *
 * @evidence contracts/common.md#principled-implementation Projects Chromium's Inspector.detached reason for the actual renderer target observer's failure classification.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the native event reason distinct from generic page errors and explicit owner shutdown.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the observer's recognized process-gone reason establishes its physical-settlement classification; an arbitrary detached event is not GPU/kernel-stop proof.
 * @evidence contracts/common.md#meaningful-documentation Documents the reported reason string and recognized Render process gone spelling without adding a timeout-derived failure.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The payload performs no observation; CDP listeners and fixed reason comparisons belong to observeHumanViewerRendererTarget.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated reports for one resident are coalesced by recovery identity, while this event itself is an independent native observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The observer owns CDP/listener lifetime; a reason string transfers no native target or browser handle.
 *
 * @author Samchon
 */
export interface IHumanViewerInspectorDetached {
  /** Chromium's reason, `Render process gone.` when the renderer exited. */
  reason: string;
}
