import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * A reversible render-mode override. Successful `restore()` puts every touched material, visibility flag, background, and overlay back as it was, so the same built scene can be captured pass after pass without rebuilding: the deterministic engine result is never mutated, only its projection.
 *
 * `restore()` also attempts disposal of resources the override created (override materials, the pose overlay's line geometries and material). A guide-pass render applies and restores its override per frame per pass, so an hour of film would otherwise leak tens of thousands of WebGL materials. Borrowed originals are never disposed; they belong to the scene. Repeated successful restore is a no-op; repeated failed restore preserves its original cause without another disposal attempt.
 *
 * An override kept across frames, as an inspection keeps its shade, is brought to each frame by `update()` where the override has one, instead of being applied again.
 *
 * @evidence contracts/development/design.md#principled-representation A pass handle pairs the selected guide mode and semantic coverage facts with exact restoration of temporary viewer state, keeping deterministic engine declarations unchanged across captures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Restoration and semantic accounting travel with the override that produced them, so callers do not reconstruct touched material or visibility state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Borrowed original materials survive restoration; only override-created resources are disposed, and semantic unaddressed/unresolved facts remain visible rather than reported as painted.
 * @evidence contracts/development/common.md#meaningful-documentation Describes reversible material/visibility/background/overlay changes, temporary-resource release, borrowed ownership and idempotent restore.
 */
export interface IAutoMovieRenderModeHandle {
  /** The pass this override draws. */
  mode: AutoMovieGuidePass;

  /**
   * What the `mask` pass segmented, or `null` for every other pass and for a
   * mask pass drawn from the legacy index ramp.
   *
   * A structural pass is evidence, and evidence has to answer for what it left
   * out. These are the same three counts {@link IAutoMovieSemanticMaskHandle}
   * carries, surfaced here so the caller that asked for the pass can read them
   * without reaching past the handle it was given.
   */
  semantic: {
    /** Meshes painted a semantic colour. */
    painted: number;
    /** Meshes left at the reserved background because no entry claimed them. */
    unaddressed: number;
    /** Semantic ids that name a drawable the scene does not hold. */
    unresolved: string[];
  } | null;

  /**
   * Bring the override to the scene as it stands now. Present when the override holds a copy of scene state that the scene's own animation does not move, which is the pose overlay's segments and the outline's shells; absent when the override follows the scene by itself, as a swapped material does.
   *
   * A caller that keeps the override across frames calls it after every change of the scene and before drawing. A caller that applies and restores per frame has no use for it.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The copy is rewritten from the scene's current transforms, so the override and the surfaces it stands for are drawn from one instant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional callback on the handle that owns the copy; an override without a copy carries none, so its absence says nothing needs refreshing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The override is refreshed in place and not restored and applied again, which would dispose and recompile its materials every frame.
   * @evidence contracts/development/common.md#meaningful-documentation States what it refreshes, which overrides have it, and who calls it when.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work follows the copied population, the bone links or the shells, with no allocation of geometry or material.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The geometries, shells and materials built at application are reused for every frame.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond what application already owns; `restore` still releases all of it.
   */
  update?: () => void;

  /**
   * Undo the override completely. Idempotent after successful restoration.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Restores captured original state and retires resources created by the pass, separating viewer projection changes from immutable engine data.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One callback carries the owning override's restoration plan instead of exposing a mutable undo list to consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Restoration preserves borrowed original material identity and does not rebuild source geometry as a substitute for undoing temporary changes.
   * @evidence contracts/development/common.md#meaningful-documentation States complete undo and limits idempotent success to an actually completed restoration.
   * @evidence contracts/development/implementation.md#efficient-algorithms Restoration work follows the touched material/visibility population and temporary overlay resources rather than rebuilding the entire scene.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A successfully restored handle avoids repeating its owned release effects; failed restoration follows the implementing owner's failure policy.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The applied override owns its temporary state/resources until this callback completes; failures remain the owning handle's responsibility rather than authorizing disposal of borrowed scene originals.
   */
  restore: () => void;
}
