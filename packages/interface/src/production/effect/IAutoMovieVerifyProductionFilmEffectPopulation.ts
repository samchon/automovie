import type { IAutoMovieCompiledFilmEffect } from "../IAutoMovieCompiledFilmEffect";
import type { IAutoMovieFilmTimeline } from "../IAutoMovieFilmTimeline";

/**
 * Inputs for checking a persisted effect population against its current film timeline.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States ordering, exact membership, compared identities, empty behavior and the production-id check left to the sampler.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A population is not an arbitrary valid subset: missing, duplicate, extra and reordered entries fail; production identity cannot be proven from this timeline alone.
 * @evidence contracts/development/design.md#principled-representation The timeline owns the film-frame clock and expected cues; the readonly runtime array preserves persisted order for verification. Engine runtime validation checks shape, digests and equality.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One timeline and one population supply every value read by verifyProductionFilmEffectPopulation; both remain caller-owned.
 */
export namespace IAutoMovieVerifyProductionFilmEffectPopulation {
  /**
   * Borrowed timeline and persisted runtime entries for an exact population check.
   *
   * Per-entry identity checks cannot see an entry that is absent, so an empty or truncated runtime array would otherwise read as current. The population must match the canonically ordered cue set one to one, every entry must pass `validateProductionFilmEffectRuntime`, and every entry must carry the timeline's film id, `inputFingerprint`, edit fingerprint and reduced frame rate together with its cue's id, zone, frame interval and intensity. The timeline does not name its production, so the `production` field is left to the sampler's identity comparison. An inconsistent timeline clock throws `film-effect-input-invalid`; every population mismatch throws `film-effect-runtime-invalid`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States ordering, exact membership, compared identities, empty behavior and the production-id check left to the sampler.
   * @evidence contracts/development/design.md#principled-representation The timeline owns the film-frame clock and expected cues; the readonly runtime array preserves persisted order for verification. Engine runtime validation checks shape, digests and equality.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One timeline and one population supply every value read by verifyProductionFilmEffectPopulation; both remain caller-owned.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A population is not an arbitrary valid subset: missing, duplicate, extra and reordered entries fail; production identity cannot be proven from this timeline alone.
   */
  export type IProps = {
    /** Current film timeline; its effect cues, input fingerprint, edit and reduced frame rate define the expected runtime population. The verifier reads without changing or retaining it. */
    timeline: IAutoMovieFilmTimeline;

    /** Complete runtime population ordered by cue start frame then UTF-16 code-unit cue ID. Empty is valid only for an empty timeline effect track. The verifier does not sort or mutate this borrowed array. */
    effects: readonly IAutoMovieCompiledFilmEffect[];
  };
}
