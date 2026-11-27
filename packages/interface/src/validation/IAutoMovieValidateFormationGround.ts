import type { IAutoMovieFormationMotion } from "../production/IAutoMovieFormationMotion";
import type { IAutoMovieFormationPlacement } from "../production/IAutoMovieFormationPlacement";
import type { IAutoMovieFormationSlotMotion } from "../production/IAutoMovieFormationSlotMotion";
import type { IAutoMovieScene } from "../scene/IAutoMovieScene";

/**
 * Compiled placement and cue population used for sampled formation support
 * checks.
 */
export namespace IAutoMovieValidateFormationGround {
  /**
   * Borrowed admitted shot data for validateFormationGround.
   * Missing/null scene space returns no diagnostics. Otherwise the gate checks
   * selected actual member world points against heightAt, reporting the first
   * void or sink greater than 1 mm per formation; standing above support is
   * allowed.
   *
   * Selection keeps extrema in sixteen XZ directions plus valid slots named by
   * sparse cues. Motion intervals receive endpoint-inclusive travel-based
   * samples with a 360-step cap. Removed members are skipped. This does not
   * prove support for every member or intermediate time. Placement identities
   * cache rest points across calls, so replace a placement object when changing
   * its data. Returned diagnostics are fresh and inputs are unchanged;
   * delegated geometry errors propagate.
   */
  export type IValue = {
    /**
     * Authored support geometry; undefined/null space skips this gate rather
     * than inventing a ground plane.
     */
    scene: Pick<IAutoMovieScene, "space">;

    /**
     * Borrowed staged units; keep each object's placement data unchanged while
     * its identity is reused because rest-member selection is cached. Empty
     * means no formations to check.
     */
    formations: readonly IAutoMovieFormationPlacement[];

    /**
     * Optional unit cues in shot-relative seconds, default empty; matching uses
     * each cue's formation id and placement applies translation, turning,
     * spacing and reform.
     */
    formationMotions?: readonly IAutoMovieFormationMotion[];

    /**
     * Optional sparse member cues, default empty; valid referenced slots join
     * the measured population and present:false members are omitted at sampled
     * times.
     */
    formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[];
  };
}
