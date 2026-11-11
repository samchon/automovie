import type { IAutoMovieRenderTextureResidency } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieFormationViewerStats } from "./IAutoMovieFormationViewerStats.js";

/**
 * Built instance runtime consumed by a viewer host.
 *
 * @evidence contracts/development/design.md#principled-representation Exposes one formation root, bounded statistics, actual gait-texture facts and camera/time updates over compiled instance chunks, with explicit one-shot disposal and a closed runtime refusal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The host receives one lifecycle handle while tier representation, cadence, culling and instance-buffer details remain in the formation builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Texture observations describe actual retained tables including future take uploads; hero appearances remain host-owned instead of being silently included in instance teardown.
 * @evidence contracts/development/common.md#meaningful-documentation Documents root mounting, LOD statistics, conservative texture preflight, disposal ownership and source hero transforms captured before runtime writes.
 */
export interface IAutoMovieFormationViewerObject {
  /** Add this group to the current scene. */
  object: THREE.Group;

  /** Current LOD and culling summary. */
  stats: IAutoMovieFormationViewerStats;

  /**
   * Actual decoded facts for every retained, reachable gait table. Pass these
   * rows into the render-budget context's `runtimeTextures`; the conservative
   * byte bound includes future take uploads. A static or successfully disposed
   * runtime returns an empty list; failed disposal retains potential table
   * ownership facts. Shadow projections allocate no additional table.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Describes each reachable declared gait table using its actual owned texture and collision-free formation/tier/gait tuple, conservatively including later seek uploads rather than counting observed native handles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates table interpretation to describeFormationTextureSources and the common texture observer instead of duplicating byte pricing in the handle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Static and successfully disposed runtimes return no table rows; failed teardown retains conservative table facts because completed attempts cannot certify full owner release. No fixture budget or guessed GLuint count is substituted.
   * @evidence contracts/development/common.md#meaningful-documentation States render-budget runtimeTextures wiring, future-upload inclusion and the absence of additional shadow table allocation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Visits drawable tier representations and their declared takes once; result records scale with tables, not anonymous member count.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Current texture fields and cleared ownership maps are reobserved because mutation or teardown can invalidate earlier facts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Fact observation acquires no GPU texture and retains no additional table ownership after return.
   */
  describeTextureSources(): NonNullable<
    IAutoMovieRenderTextureResidency["runtimeTextures"]
  >;

  /**
   * Detach this formation and release its instance, tier, shadow and gait
   * resources once. Promoted hero objects remain host-owned. A disposed
   * formation cannot be updated; construct another runtime to reuse inputs.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Marks the formation disposed, detaches its root and releases instance geometry, tier/shadow representations and gait textures while preserving host-owned promoted heroes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One handle operation owns runtime teardown, using representation disposal for the allocations shared across chunks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Teardown does not dispose hero objects or reopen the same formation for later updates; a new runtime is required for renewed ownership.
   * @evidence contracts/development/common.md#meaningful-documentation Identifies released resource categories, hero ownership and the post-disposal update refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Traverses chunks, tier meshes and shared representations once, deduplicating shared material and gait texture identities in the representation disposer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Repeated successful disposal is a no-op; repeated failed disposal throws the same stored cause without another native release attempt.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The producer attempts all chunk and tier releases before clearing runtime maps; a failed teardown retains its closing-operation list and actual resource references with the stored failure, while successful teardown drops that list.
   */
  dispose(): void;

  /**
   * Recompute chunk visibility for the current camera.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Samples unit and per-slot motion at the requested time, updates shared cadence, rewrites changed arrangement and applies camera-frustum and screen-size LOD decisions; captured hero sources preserve authored node transforms.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The host supplies camera, viewport and optional scene-source transforms while the formation runtime owns chunk visibility and anonymous instance state.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Removed members remain distinct from camera culling, and disposed runtimes refuse updates instead of mutating released buffers.
   * @evidence contracts/development/common.md#meaningful-documentation States camera-based visibility recomputation and explains that heroSources are captured before formation writes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work follows chunks, visible tier meshes and authored slot exceptions; full instance-matrix rewrites occur only when spacing or arrangement changes, while cadence sampling still follows cue count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Retains compiled chunks, per-LOD representations and gait tables; unchanged spacing/layout/progress reuse the current instance matrices, while camera/time-dependent visibility is refreshed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Updates existing runtime resources and fixed statistics; the owning formation keeps those buffers until dispose and does not create a host frame loop.
   */
  update(
    camera: THREE.PerspectiveCamera,
    viewportHeight: number,
    time?: number,
    /** Source node/object-motion TRS captured before formation writes. */
    heroSources?: ReadonlyMap<string, IAutoMovieTransform>,
  ): void;
}
