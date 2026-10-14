import type * as THREE from "three";

import { collectAutoMovieOwnedResources } from "../../collectAutoMovieOwnedResources.js";
import { restoreAutoMovieRenderModeState } from "../../restoreAutoMovieRenderModeState.js";

/**
 * Attempt retirement of each distinct geometry and standard or custom shadow
 * material owned by a preview group. All resources are collected before any
 * callback runs; a failure cannot skip later independent resources.
 *
 * Materials shared by several meshes are disposed a single time; textures are
 * left to their cache owner, unlike `disposeHumanPreview`, which also disposes
 * the textures of a decoded preview that owns them. The group itself stays
 * usable as a scene node. A returned public disposal call is an attempt, not
 * proof of native allocation retirement; failures remain visible to its caller.
 * The body and face preview renderers release replaced or withdrawn frames
 * through this one owner.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Collects distinct actual group geometry and ordinary/custom shadow materials before invoking any native disposer, then independently attempts them through the canonical restoration reporter. Cache-owned textures are deliberately omitted.
 * @evidence contracts/common.md#clear-and-simple-design One group-only release serves body and face resident renderers, separate from decoded previews that own their textures and from the scene owner's detachment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual resource identity determines deduplication, without fixture counts or replacing dispose methods. A public returned disposal means an attempt completed, not a census of freed native allocations.
 * @evidence contracts/common.md#meaningful-documentation The comment gives group versus texture ownership, collection-before-callback ordering, detachment responsibility and visible failure reporting.
 * @evidence contracts/performance.md#efficient-algorithms One scene/resource traversal and one unique-resource pass require linear work/storage in nodes and owned references; native resource listener cost is additional actual disposal work.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared references receive one attempt within the call. Lifetime memoization belongs to the renderer's retirement closer; invoking this standalone function again repeats its native effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller detaches the group and owns all collected geometry/materials. Temporary resource lists end after the call, while failed/indeterminate references remain with its renderer retirement scope; this helper never closes the borrowed GPU context.
 */
export function releaseHumanPreviewGroup(group: THREE.Group): void {
  restoreAutoMovieRenderModeState(
    collectAutoMovieOwnedResources(group).map(
      (resource: { dispose(): void }): (() => void) =>
        (): void =>
          resource.dispose(),
    ),
  );
}
