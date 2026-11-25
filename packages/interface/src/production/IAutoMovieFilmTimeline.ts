import type { IAutoMovieAudioCue } from "./IAutoMovieAudioCue";
import type { IAutoMovieEffectCue } from "./IAutoMovieEffectCue";
import type { IAutoMovieFilmOmission } from "./IAutoMovieFilmOmission";
import type { IAutoMovieFilmTimelineSegment } from "./IAutoMovieFilmTimelineSegment";
import type { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/** Canonical frame-grid film edit consumed by review, oracle and render layers. */
export interface IAutoMovieFilmTimeline {
  /** Generated timeline format. */
  version: 1;

  /** Compiler protocol that derived the timeline. */
  builder: string;

  /** Exact aggregate compile input. */
  inputFingerprint: string;

  /** Digest of normalized `src/film.ts` bytes. */
  sourceDigest: string;

  /** Stable finished-film id. */
  id: string;

  /** Production frame rate. */
  fps: number;

  /**
   * Exact reduced production frame rate.
   *
   * Integer legacy timelines may omit this field and are interpreted as
   * `fps/1`; fractional timelines must preserve their explicit identity.
   */
  frameRate?: IAutoMovieProductionFrameRate;

  /** Exact target and derived timeline duration. */
  totalFrames: number;

  /** Ordered global-to-shot mapping. */
  segments: IAutoMovieFilmTimelineSegment[];

  /** Explicitly omitted current narrative shots. */
  omissions: IAutoMovieFilmOmission[];

  /** Frame-normalized non-video tracks. */
  tracks: {
    /** Ordered audio placements. */
    audio: Array<{
      /** Stable authored audio cue id. */
      id: string;

      /** Registered source audio asset path. */
      asset: string;

      /** Admitted full source duration on the production frame grid. */
      sourceDurationFrames: number;

      /** First source frame read from the audio asset. */
      sourceOffsetFrame: number;

      /** Inclusive film-global placement frame. */
      startFrame: number;

      /** Number of placed source frames. */
      durationFrames: number;

      /** Non-negative linear amplitude multiplier. */
      gain: number;

      /** Fade-in length within this placement, in frames. */
      fadeInFrames: number;

      /** Fade-out length within this placement, in frames. */
      fadeOutFrames: number;

      /** Mixing bus inherited from the authored cue. */
      bus: IAutoMovieAudioCue["bus"];
    }>;

    /** Ordered caption placements. */
    captions: Array<{
      /** Stable authored caption cue id. */
      id: string;

      /** Display text preserved from the authored cue. */
      text: string;

      /** Language tag carried to caption delivery. */
      language: string;

      /** Optional authored speaker identity; absence leaves it unspecified. */
      speaker?: string;

      /**
       * Preferred edge for the horizontal WebVTT cue. Omit to use automatic
       * line placement.
       */
      placement?: "top" | "bottom";

      /** Inclusive film-global caption frame. */
      startFrame: number;

      /** Exclusive film-global caption frame. */
      endFrame: number;
    }>;

    /** Ordered effect placements. */
    effects: Array<{
      /** Stable authored effect cue id. */
      id: string;

      /** Closed deterministic effect recipe. */
      recipe: IAutoMovieEffectCue["recipe"];

      /** Named world zone admitted by the compiler. */
      zone: string;

      /** Inclusive film-global effect frame. */
      startFrame: number;

      /** Number of film-global frames occupied by the effect. */
      durationFrames: number;

      /** Recipe intensity carried into the compiled effect population. */
      intensity: number;
    }>;
  };
}
