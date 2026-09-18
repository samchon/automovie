import { IAutoMovieAudioCue } from "./IAutoMovieAudioCue";
import { IAutoMovieCaptionCue } from "./IAutoMovieCaptionCue";
import { IAutoMovieEffectCue } from "./IAutoMovieEffectCue";
import { IAutoMovieFilmOmission } from "./IAutoMovieFilmOmission";
import { IAutoMovieVideoEdit } from "./IAutoMovieVideoEdit";

/**
 * Coding-agent-authored finished-film edit before frame normalization.
 *
 * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `IAutoMovieFilmEdit` as the portable data boundary for the agent declared omission requirement.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `IAutoMovieFilmEdit` for the spec authoring partial target input system contract.
 */
export interface IAutoMovieFilmEdit {
  /**
   * Stable film id, equal to production id.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `id` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `id` for the spec authoring partial target input system contract.
   */
  id: string;
  /**
   * Explicit accounting for intentionally unused shot contracts.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `omissions` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `omissions` for the spec authoring partial target input system contract.
   */
  omissions: IAutoMovieFilmOmission[];
  /**
   * Narrow deterministic edit tracks.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `tracks` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `tracks` for the spec authoring partial target input system contract.
   */
  tracks: {
    /** Ordered source-shot placements. */
    video: IAutoMovieVideoEdit[];
    /** Ordered audio cues. */
    audio: IAutoMovieAudioCue[];
    /** Ordered caption cues. */
    captions: IAutoMovieCaptionCue[];
    /** Ordered supported-effect cues. */
    effects: IAutoMovieEffectCue[];
  };
}
