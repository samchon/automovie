import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieAcousticResponseProfile } from "./IAutoMovieAcousticResponseProfile";
import { IAutoMovieProductionDialogueLine } from "./IAutoMovieProductionDialogueLine";
import { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";
import { IAutoMovieProductionSoundCue } from "./IAutoMovieProductionSoundCue";
import { IAutoMovieProductionSoundEvent } from "./IAutoMovieProductionSoundEvent";
import { IAutoMovieSoundPropagationProfile } from "./IAutoMovieSoundPropagationProfile";

/** Complete deterministic sound input derived from one compiled film edit. */
export interface IAutoMovieProductionSoundPlan {
  /** Sound-plan schema. */
  version: 1;

  /** Exact builder input shared with the film timeline. */
  inputFingerprint: AutoMovieContentDigest;

  /** Production frame rate. */
  fps: number;

  /**
   * Exact frame rate when `fps` is fractional. Integer legacy rates use an
   * equivalent denominator of one when this field is omitted.
   */
  frameRate?: IAutoMovieProductionFrameRate;

  /** Exact finished-film frame count. */
  totalFrames: number;

  /** Fixed output PCM sample rate. */
  sampleRate: 48_000;

  /** Fixed interleaved stereo channel count. */
  channels: 2;

  /**
   * Selected direct-path propagation profile, or null for the byte-compatible
   * legacy dry path.
   */
  propagationProfile?: IAutoMovieSoundPropagationProfile;

  /**
   * Selected room-response source, or absent for the byte-compatible dry path.
   */
  acousticProfile?: IAutoMovieAcousticResponseProfile;

  /** Ordered semantic sound occurrences. */
  events: IAutoMovieProductionSoundEvent[];

  /** Ordered authored procedural score cues. */
  cues: IAutoMovieProductionSoundCue[];

  /** Ordered dialogue/caption placements. */
  dialogue: IAutoMovieProductionDialogueLine[];
}
