import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * A reversible render-mode override. Successful `restore()` puts every touched material, visibility flag, background, and overlay back as it was, so the same built scene can be captured pass after pass without rebuilding: the deterministic engine result is never mutated, only its projection.
 *
 * `restore()` also attempts disposal of resources the override created (override materials, the pose overlay's line geometries and material). A guide-pass render applies and restores its override per frame per pass, so an hour of film would otherwise leak tens of thousands of WebGL materials. Borrowed originals are never disposed; they belong to the scene. Repeated successful restore is a no-op; repeated failed restore preserves its original cause without another disposal attempt.
 *
 * @evidence contracts/common.md#principled-implementation A pass handle pairs the selected guide mode and semantic coverage facts with exact restoration of temporary viewer state, keeping deterministic engine declarations unchanged across captures.
 * @evidence contracts/common.md#clear-and-simple-design Restoration and semantic accounting travel with the override that produced them, so callers do not reconstruct touched material or visibility state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Borrowed original materials survive restoration; only override-created resources are disposed, and semantic unaddressed/unresolved facts remain visible rather than reported as painted.
 * @evidence contracts/common.md#meaningful-documentation Describes reversible material/visibility/background/overlay changes, temporary-resource release, borrowed ownership and idempotent restore.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This handle chooses no scene traversal or pass algorithm; each render-mode implementation owns that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The handle represents an applied effect, while its restore implementation owns completed-call deduplication.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type itself acquires no override material; producer handles retain and release their exact temporary resources through restore.
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
   * Undo the override completely. Idempotent after successful restoration.
   *
   * @evidence contracts/common.md#principled-implementation Restores captured original state and retires resources created by the pass, separating viewer projection changes from immutable engine data.
   * @evidence contracts/common.md#clear-and-simple-design One callback carries the owning override's restoration plan instead of exposing a mutable undo list to consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Restoration preserves borrowed original material identity and does not rebuild source geometry as a substitute for undoing temporary changes.
   * @evidence contracts/common.md#meaningful-documentation States complete undo and limits idempotent success to an actually completed restoration.
   * @evidence contracts/performance.md#efficient-algorithms Restoration work follows the touched material/visibility population and temporary overlay resources rather than rebuilding the entire scene.
   * @evidence contracts/performance.md#reuse-equivalent-work A successfully restored handle avoids repeating its owned release effects; failed restoration follows the implementing owner's failure policy.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The applied override owns its temporary state/resources until this callback completes; failures remain the owning handle's responsibility rather than authorizing disposal of borrowed scene originals.
   */
  restore: () => void;
}
