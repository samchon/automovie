import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieAudioCue } from "./IAutoMovieAudioCue";
import { IAutoMovieEffectCue } from "./IAutoMovieEffectCue";
import { IAutoMovieFilmOmission } from "./IAutoMovieFilmOmission";
import { IAutoMovieFilmTimelineSegment } from "./IAutoMovieFilmTimelineSegment";
import { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/** Canonical global timeline consumed by review, oracle and render layers. */
export interface IAutoMovieFilmTimeline {
  /** Generated timeline format. */
  version: 1;

  /** Compiler protocol that derived the timeline. */
  builder: string;

  /** Exact aggregate compile input. */
  inputFingerprint: AutoMovieContentDigest;

  /** Digest of normalized `src/film.ts` bytes. */
  sourceDigest: AutoMovieContentDigest;

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
      id: string;
      asset: string;
      sourceDurationFrames: number;
      sourceOffsetFrame: number;
      startFrame: number;
      durationFrames: number;
      gain: number;
      fadeInFrames: number;
      fadeOutFrames: number;
      bus: IAutoMovieAudioCue["bus"];
    }>;

    /** Ordered caption placements. */
    captions: Array<{
      id: string;
      text: string;
      language: string;
      speaker?: string;
      startFrame: number;
      endFrame: number;
    }>;

    /** Ordered effect placements. */
    effects: Array<{
      id: string;
      recipe: IAutoMovieEffectCue["recipe"];
      zone: string;
      startFrame: number;
      durationFrames: number;
      intensity: number;
    }>;
  };
}
