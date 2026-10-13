import { IAutoMovieAudioCue } from "./IAutoMovieAudioCue";
import { IAutoMovieCaptionCue } from "./IAutoMovieCaptionCue";
import { IAutoMovieEffectCue } from "./IAutoMovieEffectCue";
import { IAutoMovieFilmOmission } from "./IAutoMovieFilmOmission";
import { IAutoMovieVideoEdit } from "./IAutoMovieVideoEdit";

/**
 * Authored finished-film edit before normalization to the production frame grid. Every current shot is placed once or explicitly omitted, and the film id matches the active production.
 *
 * @evidence contracts/common.md#principled-implementation Four ordered tracks describe exact video placement and timed audio, caption and world-effect cues; film assembly resolves their frame boundaries and requires complete nonoverlapping shot-use or omission accounting.
 * @evidence contracts/common.md#clear-and-simple-design Narrative shot order and timed supplementary tracks share one edit record, while generated timeline frames, compile fingerprints and delivery bytes remain compiler-owned outputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing shot cannot disappear implicitly, a shot cannot both play and be omitted, and malformed or off-grid timed tracks refuse normalization instead of being silently trimmed into the target runtime.
 * @evidence contracts/common.md#meaningful-documentation States author ownership before frame normalization, production-id equality, exact shot accounting and the four separately ordered track roles.
 * @author Samchon
 */
export interface IAutoMovieFilmEdit {
  /** Stable film id, equal to production id. */
  id: string;

  /** Explicit accounting for intentionally unused shot contracts. */
  omissions: IAutoMovieFilmOmission[];

  /** Narrow deterministic edit tracks. */
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
