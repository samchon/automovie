import type { IAutoMovieFormationMotion } from "../production/IAutoMovieFormationMotion";
import type { IAutoMovieFormationPlacement } from "../production/IAutoMovieFormationPlacement";
import type { IAutoMovieFormationSlotMotion } from "../production/IAutoMovieFormationSlotMotion";
import type { IAutoMovieScene } from "../scene/IAutoMovieScene";

/**
 * Compiled placement and cue population used for sampled formation support checks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compiled placement and cue population used for sampled formation support checks. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation World-metre placements and second-based cues join only the scene's authored space.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The formation ground gate reuses placement and height-query contracts without a rendered crowd.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite member/time sampling and unchanged identity-cache premises limit a clean diagnostic result.
 */
export namespace IAutoMovieValidateFormationGround {
  /**
   * Borrowed admitted shot data for validateAutoMovieFormationGround. Missing/null scene space returns no diagnostics. Otherwise the gate checks selected actual member world points against heightAt, reporting the first void or sink greater than 1 mm per formation; standing above support is allowed.
   *
   * Selection keeps extrema in sixteen XZ directions plus valid slots named by sparse cues. Motion intervals receive endpoint-inclusive travel-based samples with a 360-step cap. Removed members are skipped. This does not prove support for every member or intermediate time. Placement identities cache rest points across calls, so replace a placement object when changing its data. Returned diagnostics are fresh and inputs are unchanged; delegated geometry errors propagate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines sampling/height policy, absent-space behavior, ownership, cache premise and unsupported completeness claims.
   * @evidence contracts/development/design.md#principled-representation Canonical placements use world metre points and cue clocks use shot-relative seconds; scene contributes only its authored walkable space.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The production formation gate reads placement, shared unit/member cues and scene space without a rendered crowd or actor graph.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Sample caps and identity-cache assumptions remain explicit; no-space omission or no findings is not an all-member continuous support certificate.
   */
  export type IValue = {
    /** Authored support geometry; undefined/null space skips this gate rather than inventing a ground plane. */
    scene: Pick<IAutoMovieScene, "space">;

    /** Borrowed staged units; keep each object's placement data unchanged while its identity is reused because rest-member selection is cached. Empty means no formations to check. */
    formations: readonly IAutoMovieFormationPlacement[];

    /** Optional unit cues in shot-relative seconds, default empty; matching uses each cue's formation id and placement applies translation, turning, spacing and reform. */
    formationMotions?: readonly IAutoMovieFormationMotion[];

    /** Optional sparse member cues, default empty; valid referenced slots join the measured population and present:false members are omitted at sampled times. */
    formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[];
  };
}
