import type { IAutoMovieCompiledFormation } from "../production/IAutoMovieCompiledFormation";
import type { IAutoMovieFormationSlotMotion } from "../production/IAutoMovieFormationSlotMotion";

/**
 * Compiled slot identities and authored sparse cues inspected by formation
 * member-motion admission.
 */
export namespace IAutoMovieValidateFormationSlotMotions {
  /**
   * Borrowed typed populations for validateAutoMovieFormationSlotMotions. It
   * checks nonblank unique cue ids, participation in the separately supplied
   * shot contract, positive intervals inside its duration, unique resident
   * slots, hero exclusion, finite bounded offsets/facing and per-slot
   * nonoverlap. It reports more than 256 cues or 1024 total slot entries
   * without truncating inspection.
   *
   * Sorting a copied cue array by formation/start/id preserves source arrays.
   * Diagnostics are fresh; malformed object/container shapes can throw because
   * this is not a raw-artifact shape gate. Compiled formation
   * identity/count/hero validity and cue discriminant/easing admission remain
   * upstream.
   */
  export type IValue = {
    /**
     * Compiled identity/count/hero table used for cue references; duplicate ids
     * use the last entry, so formation uniqueness is an upstream premise.
     */
    formations: readonly Pick<
      IAutoMovieCompiledFormation,
      "id" | "count" | "heroes"
    >[];

    /**
     * Required sparse cues, possibly empty. State offsets must lie within
     * +/-1e9 metres and facing offsets within +/-360000 degrees; intervals
     * satisfy 0<=start<end<=shot duration.
     */
    formationSlotMotions: readonly IAutoMovieFormationSlotMotion[];
  };
}
