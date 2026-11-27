import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieFormationMotion } from "../production/IAutoMovieFormationMotion";
import type { IAutoMovieFormationPlacement } from "../production/IAutoMovieFormationPlacement";
import type { IAutoMovieFormationSlotMotion } from "../production/IAutoMovieFormationSlotMotion";

/** Runtime model and cue population used by sampled formation-overlap admission. */
export namespace IAutoMovieValidateFormationOverlap {
  /**
   * Borrowed admitted placements and models for
   * validateFormationOverlap. The gate checks at most the first 4096
   * slots per formation at zero, every cue endpoint and budgeted interior
   * times. Removed members are omitted. Each unit pair, including a unit
   * against itself, receives at most its first observed overlap diagnostic.
   *
   * Runtime model columns supply occupied radii and vertical ranges in metres.
   * Clearance takes the minimum across LOD pairs of each pair's widest radius
   * sum with strictly overlapping heights. Units with no tiers or any tier
   * lacking measurable columns are skipped. Thus missing/unsupported geometry,
   * unsampled slots/times, animated deformation and GPU narrowing remain
   * outside this gate.
   *
   * Inputs are unchanged; placement identities retain cached rest-member points
   * across calls and must be replaced when edited. Fresh diagnostics carry
   * formatted scalar observations, not body handles. Model/placement sampling
   * exceptions propagate.
   */
  export type IValue = {
    /**
     * Compiled model population indexed by exact model.id; duplicate ids use
     * the last record and missing ids yield no columns, so model
     * admission/uniqueness belongs upstream.
     */
    models: readonly IAutoMovieModel[];

    /**
     * Staged units and all possible runtime tiers; rest placement must remain
     * unchanged while each object identity is reused by the member cache.
     */
    formations: ReadonlyArray<
      IAutoMovieFormationPlacement & {
        /**
         * Tier model references; an empty list or any unmeasurable tier skips
         * the entire unit.
         */
        lod: ReadonlyArray<{
          /** Exact id into models, not asset bytes or a native render handle. */
          runtimeModel: string;
        }>;
      }
    >;

    /**
     * Optional unit cues in shot-relative seconds, default empty; all endpoints
     * enter the sample clock even when they exceed the nominal sixteen-sample
     * budget.
     */
    formationMotions?: readonly IAutoMovieFormationMotion[];

    /**
     * Optional sparse member cues, default empty; their endpoints enter the
     * clock but their slots do not extend the first-4096 member prefix.
     */
    formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[];
  };
}
