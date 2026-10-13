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
 */
export function disposeHumanPreview(group: THREE.Group): void {
  restoreAutoMovieRenderModeState(
    collectAutoMovieOwnedResources(group, true).map((resource) => () => resource.dispose()),
  );
}
