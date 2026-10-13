import { IAutoMovieAudioCue } from "./IAutoMovieAudioCue";
import { IAutoMovieCaptionCue } from "./IAutoMovieCaptionCue";
import { IAutoMovieEffectCue } from "./IAutoMovieEffectCue";
import { IAutoMovieFilmOmission } from "./IAutoMovieFilmOmission";
import { IAutoMovieVideoEdit } from "./IAutoMovieVideoEdit";

/** Coding-agent-authored finished-film edit before frame normalization. */
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
