import type { IPlaygroundViewerApplication } from "./IPlaygroundViewerApplication";
import type {} from "./IPlaygroundViewerPage";

/**
 * Supply an existing application's input owner to the normal page bridge. Unhosted/offline pages expose no bridge, so registration has no effect there; this does not certify their completion or display health.
 *
 * @evidence contracts/common.md#principled-implementation The optional bridge receives the original ready/capture/restore callbacks, preserving their transaction authority instead of assigning fields or replaying DOM events.
 * @evidence contracts/common.md#clear-and-simple-design One direct handoff adds no editor, evaluator, renderer or alternative state store.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing bridge remains absence rather than a fabricated ready frame or source-admission receipt.
 * @evidence contracts/common.md#meaningful-documentation The comment defines optional hosting and the limited registration effect.
 * @evidence contracts/performance.md#efficient-algorithms A single optional property lookup and call are constant work; initialization/restoration/frame observation remain the bridge/application's real costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registration is an owner handoff, not a numerical result or effect cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This adapter retains no reference itself; the concrete bridge owns registered callbacks until pagehide, while application renderer/worker lifetimes remain their original owners.
 *
 * @author Samchon
 */
export function registerPlaygroundViewerApplication(application: IPlaygroundViewerApplication): void {
  window.__playgroundViewerPage?.register(application);
}
