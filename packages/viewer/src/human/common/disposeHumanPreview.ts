import type * as THREE from "three";

import { collectAutoMovieOwnedResources } from "../../collectAutoMovieOwnedResources.js";
import { restoreAutoMovieRenderModeState } from "../../restoreAutoMovieRenderModeState.js";

/**
 * Release the geometry and finishes owned by one discarded decoded preview.
 * The scene owner removes a published group before releasing it; stale decoded
 * groups can be released without ever entering the visible scene. Geometry,
 * standard/custom shadow materials and their textures are collected once by
 * object identity before independently attempting every public disposal.
 * Cache-backed groups use releaseHumanPreviewGroup instead, leaving texture
 * retirement to the actual cache owner. Completion reports every public
 * operation's result, not a physical allocation census; failures never become
 * a successful release claim.
 *
 * @evidence contracts/common.md#principled-implementation Collects unique owned geometry, ordinary/custom shadow materials and direct textures by identity, then independently invokes each disposer through restoreAutoMovieRenderModeState so one throw does not skip other resources.
 * @evidence contracts/common.md#clear-and-simple-design This decoded-preview release includes owned textures; cache-backed resident groups use the separate group-only release owner. Scene detachment remains with the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ownership is actual decoded-group provenance rather than all arbitrary scene textures; callers must not pass a group with borrowed/shared assets. Failure is reported rather than treated as proven physical release.
 * @evidence contracts/common.md#meaningful-documentation The comment states decoded versus cache-backed ownership, detachment order and independent failure reporting. Current production resident paths use releaseHumanPreviewGroup rather than this legacy public helper.
 * @evidence contracts/performance.md#efficient-algorithms Traverses the group and resource references once with identity sets, then visits R unique resources, linear in scene/resource population; native disposal cost stays with each resource.
 * @evidence contracts/performance.md#reuse-equivalent-work Deduplication shares one attempt for repeated references within a call. The function has no lifetime completion memo, so calling it again repeats native disposal effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns final group detachment and retirement of all collected owned assets. Temporary sets/operation closures end after the synchronous call; failures leave uncertain resource ownership with that caller.
 */
export function disposeHumanPreview(group: THREE.Group): void {
  restoreAutoMovieRenderModeState(
    collectAutoMovieOwnedResources(group, true).map(
      (resource: { dispose(): void }): (() => void) =>
        (): void =>
          resource.dispose(),
    ),
  );
}
