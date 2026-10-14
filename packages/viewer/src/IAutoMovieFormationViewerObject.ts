import type { IAutoMovieTransform } from "@automovie/interface";
import type { IAutoMovieRenderTextureResidency } from "@automovie/engine";
import type * as THREE from "three";
import type { IAutoMovieFormationViewerStats } from "./IAutoMovieFormationViewerStats.js";

/**
 * Built instance runtime consumed by a viewer host.
 *
 * @evidence contracts/common.md#principled-implementation Exposes one formation root, bounded statistics, actual gait-texture facts and camera/time updates over compiled instance chunks, with explicit one-shot disposal and a closed runtime refusal.
 * @evidence contracts/common.md#clear-and-simple-design The host receives one lifecycle handle while tier representation, cadence, culling and instance-buffer details remain in the formation builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Texture observations describe actual retained tables including future take uploads; hero appearances remain host-owned instead of being silently included in instance teardown.
 * @evidence contracts/common.md#meaningful-documentation Documents root mounting, LOD statistics, conservative texture preflight, disposal ownership and source hero transforms captured before runtime writes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This handle declares operations but executes no culling or matrix traversal; buildInstancedFormation owns those choices.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The interface does not coordinate work; the runtime shares representations and table textures across its instance chunks.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The handle defines disposal ownership but acquires nothing itself; its producer owns chunk, tier, shadow and gait allocations until dispose.
 *
 * @author Samchon
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
   * @evidence contracts/common.md#principled-implementation Describes each reachable declared gait table using its actual owned texture and collision-free formation/tier/gait tuple, conservatively including later seek uploads rather than counting observed native handles.
   * @evidence contracts/common.md#clear-and-simple-design Delegates table interpretation to describeFormationTextureSources and the common texture observer instead of duplicating byte pricing in the handle.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Static and successfully disposed runtimes return no table rows; failed teardown retains conservative table facts because completed attempts cannot certify full owner release. No fixture budget or guessed GLuint count is substituted.
   * @evidence contracts/common.md#meaningful-documentation States render-budget runtimeTextures wiring, future-upload inclusion and the absence of additional shadow table allocation.
   * @evidence contracts/performance.md#efficient-algorithms Visits drawable tier representations and their declared takes once; result records scale with tables, not anonymous member count.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current texture fields and cleared ownership maps are reobserved because mutation or teardown can invalidate earlier facts.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fact observation acquires no GPU texture and retains no additional table ownership after return.
   */
  describeTextureSources(): NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]>;

  /**
   * Detach this formation and release its instance, tier, shadow and gait
   * resources once. Promoted hero objects remain host-owned. A disposed
   * formation cannot be updated; construct another runtime to reuse inputs.
   *
   * @evidence contracts/common.md#principled-implementation Marks the formation disposed, detaches its root and releases instance geometry, tier/shadow representations and gait textures while preserving host-owned promoted heroes.
   * @evidence contracts/common.md#clear-and-simple-design One handle operation owns runtime teardown, using representation disposal for the allocations shared across chunks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Teardown does not dispose hero objects or reopen the same formation for later updates; a new runtime is required for renewed ownership.
   * @evidence contracts/common.md#meaningful-documentation Identifies released resource categories, hero ownership and the post-disposal update refusal.
   * @evidence contracts/performance.md#efficient-algorithms Traverses chunks, tier meshes and shared representations once, deduplicating shared material and gait texture identities in the representation disposer.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated successful disposal is a no-op; repeated failed disposal throws the same stored cause without another native release attempt.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The producer attempts all chunk and tier releases before clearing runtime maps; a failed teardown retains its closing-operation list and actual resource references with the stored failure, while successful teardown drops that list.
   */
  dispose(): void;

  /**
   * Recompute chunk visibility for the current camera.
   *
   * @evidence contracts/common.md#principled-implementation Samples unit and per-slot motion at the requested time, updates shared cadence, rewrites changed arrangement and applies camera-frustum and screen-size LOD decisions; captured hero sources preserve authored node transforms.
   * @evidence contracts/common.md#clear-and-simple-design The host supplies camera, viewport and optional scene-source transforms while the formation runtime owns chunk visibility and anonymous instance state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Removed members remain distinct from camera culling, and disposed runtimes refuse updates instead of mutating released buffers.
   * @evidence contracts/common.md#meaningful-documentation States camera-based visibility recomputation and explains that heroSources are captured before formation writes.
   * @evidence contracts/performance.md#efficient-algorithms Work follows chunks, visible tier meshes and authored slot exceptions; full instance-matrix rewrites occur only when spacing or arrangement changes, while cadence sampling still follows cue count.
   * @evidence contracts/performance.md#reuse-equivalent-work Retains compiled chunks, per-LOD representations and gait tables; unchanged spacing/layout/progress reuse the current instance matrices, while camera/time-dependent visibility is refreshed.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Updates existing runtime resources and fixed statistics; the owning formation keeps those buffers until dispose and does not create a host frame loop.
   */
  update(
    camera: THREE.PerspectiveCamera,
    viewportHeight: number,
    time?: number,
    /** Source node/object-motion TRS captured before formation writes. */
    heroSources?: ReadonlyMap<string, IAutoMovieTransform>,
  ): void;
}

