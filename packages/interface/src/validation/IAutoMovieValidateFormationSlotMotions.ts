import type { IAutoMovieCompiledFormation } from "../production/IAutoMovieCompiledFormation";
import type { IAutoMovieFormationSlotMotion } from "../production/IAutoMovieFormationSlotMotion";

/**
 * Compiled slot identities and authored sparse cues inspected by formation member-motion admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compiled slot identities and authored sparse cues inspected by formation member-motion admission. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation Formation ids and zero-based slot ordinals bind metre/degree states to second-based intervals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Sparse cue admission needs only compiled id/count/heroes plus canonical cue records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Hero exclusion preserves explicit actor ownership and typed shape remains an upstream premise.
 */
export namespace IAutoMovieValidateFormationSlotMotions {
  /**
   * Borrowed typed populations for validateAutoMovieFormationSlotMotions. It checks nonblank unique cue ids, participation in the separately supplied shot contract, positive intervals inside its duration, unique resident slots, hero exclusion, finite bounded offsets/facing and per-slot nonoverlap. It reports more than 256 cues or 1024 total slot entries without truncating inspection.
   *
   * Sorting a copied cue array by formation/start/id preserves source arrays. Diagnostics are fresh; malformed object/container shapes can throw because this is not a raw-artifact shape gate. Compiled formation identity/count/hero validity and cue discriminant/easing admission remain upstream.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines checked scheduling rules, population limits, sorted-copy ownership and the typed-shape premise.
   * @evidence contracts/development/design.md#principled-representation Zero-based slot ordinals belong to exact formation ids, cue clocks are shot-relative seconds, offsets metres and facing degrees; canonical cue records own state shape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only id/count/heroes are projected from compiled formations to establish slot residency and exclude independently owned hero actors.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Excess cues are reported rather than truncated, heroes cannot receive a second transform owner, and touching half-open intervals are allowed without a time tolerance.
   */
  export type IValue = {
    /** Compiled identity/count/hero table used for cue references; duplicate ids use the last entry, so formation uniqueness is an upstream premise. */
    formations: readonly Pick<
      IAutoMovieCompiledFormation,
      "id" | "count" | "heroes"
    >[];

    /** Required sparse cues, possibly empty. State offsets must lie within +/-1e9 metres and facing offsets within +/-360000 degrees; intervals satisfy 0<=start<end<=shot duration. */
    formationSlotMotions: readonly IAutoMovieFormationSlotMotion[];
  };
}
