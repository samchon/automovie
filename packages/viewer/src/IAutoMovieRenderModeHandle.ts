import type {AutoMovieGuidePass} from "@automovie/interface";

/**
 * A reversible render-mode override. `restore()` puts every touched material,
 * visibility flag, background, and overlay back exactly as it was, so the same
 * built scene can be captured pass after pass without rebuilding: the
 * deterministic engine result is never mutated, only its projection.
 *
 * `restore()` also **disposes every resource the override created** (override
 * materials, the pose overlay's line geometries and material): a guide-pass
 * render applies and restores restoreAutoMovieRenderModeOnce per frame per pass, so an hour of film would
 * otherwise leak tens of thousands of WebGL materials. Borrowed originals are
 * never disposed; they belong to the scene. Restoring twice is safe: the second
 * call is a no-op, so nothing double-disposes.
 *
 * @author Samchon
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

  /** Undo the override completely. Idempotent. */
  restore: () => void;
}
