import type { IAutoMovieFormationMotion } from "../production/IAutoMovieFormationMotion";
import type { IAutoMovieFormationPlacement } from "../production/IAutoMovieFormationPlacement";
import type { IAutoMovieFormationSlotMotion } from "../production/IAutoMovieFormationSlotMotion";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";

/**
 * Runtime model and cue population used by sampled formation-overlap admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Runtime model and cue population used by sampled formation-overlap admission. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation Tier references are model ids while placement and occupied columns use metre geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The overlap gate projects runtime tier identity onto canonical placement and cue records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing columns and sampling limits are omissions, not guessed collision envelopes.
 */
export namespace IAutoMovieValidateFormationOverlap {
  /**
   * Borrowed admitted placements and models for validateAutoMovieFormationOverlap. The gate checks at most the first 4096 slots per formation at zero, every cue endpoint and budgeted interior times. Removed members are omitted. Each unit pair, including a unit against itself, receives at most its first observed overlap diagnostic.
   *
   * Runtime model columns supply occupied radii and vertical ranges in metres. Clearance takes the minimum across LOD pairs of each pair's widest radius sum with strictly overlapping heights. Units with no tiers or any tier lacking measurable columns are skipped. Thus missing/unsupported geometry, unsampled slots/times, animated deformation and GPU narrowing remain outside this gate.
   *
   * Inputs are unchanged; placement identities retain cached rest-member points across calls and must be replaced when edited. Fresh diagnostics carry formatted scalar observations, not body handles. Model/placement sampling exceptions propagate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines member/time limits, tier clearance, omitted geometry, borrowed inputs, cache premise and fresh diagnostics.
   * @evidence contracts/development/design.md#principled-representation Existing world-metre placement and model-column contracts meet through exact runtime model ids; cue clocks use shot-relative seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The projection adds only each tier's runtime model identity needed to measure occupied columns, without a renderer or native collision world.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported tier geometry is skipped rather than replaced by guessed size; no findings cannot certify all members, all times or every possible LOD collision.
   */
  export type IValue = {
    /** Compiled model population indexed by exact model.id; duplicate ids use the last record and missing ids yield no columns, so model admission/uniqueness belongs upstream. */
    models: readonly IAutoMovieModel[];

    /** Staged units and all possible runtime tiers; rest placement must remain unchanged while each object identity is reused by the member cache. */
    formations: ReadonlyArray<
      IAutoMovieFormationPlacement & {
        /** Tier model references; an empty list or any unmeasurable tier skips the entire unit. */
        lod: ReadonlyArray<{
          /** Exact id into models, not asset bytes or a native render handle. */
          runtimeModel: string;
        }>;
      }
    >;

    /** Optional unit cues in shot-relative seconds, default empty; all endpoints enter the sample clock even when they exceed the nominal sixteen-sample budget. */
    formationMotions?: readonly IAutoMovieFormationMotion[];

    /** Optional sparse member cues, default empty; their endpoints enter the clock but their slots do not extend the first-4096 member prefix. */
    formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[];
  };
}
