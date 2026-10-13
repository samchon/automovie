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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Attempts every distinct resource of a withdrawn preview and preserves cleanup failures, leaving texture retirement to its cache owner.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Collects each geometry and standard/custom shadow material once before independently attempting disposal; successful public calls do not certify physical retirement.
 * @author Samchon
 */
export function releaseHumanPreviewGroup(group: THREE.Group): void {
  restoreAutoMovieRenderModeState(
    collectAutoMovieOwnedResources(group).map((resource) => () => resource.dispose()),
  );
}
