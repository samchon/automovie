import { IAutoMovieAudioCue } from "./IAutoMovieAudioCue";
import { IAutoMovieEffectCue } from "./IAutoMovieEffectCue";
import { IAutoMovieFilmOmission } from "./IAutoMovieFilmOmission";
import { IAutoMovieFilmTimelineSegment } from "./IAutoMovieFilmTimelineSegment";
import { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/**
 * Canonical frame-grid film edit consumed by review, oracle and render layers.
 *
 * @evidence contracts/common.md#principled-implementation Integer-frame placements let Engine sampling, sound/effects and Render planning share one frame grid. The production timeline compiler/parser is retired; callers must supply normalized intervals and verified provenance. Render planning checks production identity, rational clock and target duration, while film-effect verification checks effect population and content identities rather than every edit or source byte.
 * @evidence contracts/common.md#clear-and-simple-design Segments own video mapping while three inline track arrays own audio, captions and effects; the optional exact frame-rate record preserves fractional identity separately from numeric fps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Integer legacy timelines may omit frameRate and mean fps/1 under resolveProductionFrameRate. Declared inputFingerprint/sourceDigest are not independent current-byte proof; no surviving production manifest parser supplies that fence automatically.
 * @evidence contracts/common.md#meaningful-documentation Defines generated identity, half-open segment mapping, frame units, exact frame-rate compatibility and each non-video track's source and destination fields.
 * @author Samchon
 */
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
   * Integer legacy timelines may omit this field and are interpreted as `fps/1`; fractional timelines must preserve their explicit identity.
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
