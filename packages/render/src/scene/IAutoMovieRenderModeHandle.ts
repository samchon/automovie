import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * A reversible render-mode override. Successful `restore()` puts every touched
 * material, visibility flag, background, and overlay back as it was, so the
 * same built scene can be captured pass after pass without rebuilding: the
 * deterministic engine result is never mutated, only its projection.
 *
 * `restore()` also attempts disposal of resources the override created
 * (override materials, the pose overlay's line geometries and material). A
 * guide-pass render applies and restores its override per frame per pass, so an
 * hour of film would otherwise leak tens of thousands of WebGL materials.
 * Borrowed originals are never disposed; they belong to the scene. Repeated
 * successful restore is a no-op; repeated failed restore preserves its original
 * cause without another disposal attempt.
 *
 * An override kept across frames, as an inspection keeps its shade, is brought
 * to each frame by `update()` where the override has one, instead of being
 * applied again.
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
   * Bring the override to the scene as it stands now. Present when the override
   * holds a copy of scene state that the scene's own animation does not move,
   * which is the pose overlay's segments and the outline's shells; absent when
   * the override follows the scene by itself, as a swapped material does.
   *
   * A caller that keeps the override across frames calls it after every change
   * of the scene and before drawing. A caller that applies and restores per
   * frame has no use for it.
   */
  update?: () => void;

  /** Undo the override completely. Idempotent after successful restoration. */
  restore: () => void;
}
