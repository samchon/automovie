import { IAutoMovieAcousticResponseProfile } from "./IAutoMovieAcousticResponseProfile";
import { IAutoMovieProductionDialogueLine } from "./IAutoMovieProductionDialogueLine";
import { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";
import { IAutoMovieProductionSoundCue } from "./IAutoMovieProductionSoundCue";
import { IAutoMovieProductionSoundEvent } from "./IAutoMovieProductionSoundEvent";
import { IAutoMovieSoundPropagationProfile } from "./IAutoMovieSoundPropagationProfile";

/**
 * Deterministic semantic sound input derived from one current compiled film edit.
 *
 * @evidence contracts/development/design.md#principled-representation deriveProductionSoundPlan maps trimmed shot events, authored audio cues and caption dialogue onto the same rational film frame clock, retaining compile identity and explicit production acoustic profiles for a fixed 48 kHz stereo mix.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Ordered events, cues and dialogue separate semantic occurrence synthesis, adopted source playback and generated speech; the plan contains references and normalized timing while callers own decoded buffers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing shot contracts, compiled source or camera refuse during planning; omitted propagation and acoustic profiles deliberately preserve the legacy dry path and supply no guessed room or physical policy.
 * @evidence contracts/development/common.md#meaningful-documentation Defines compile binding, exact frame-rate compatibility, total frame extent, fixed PCM format, optional profile absence and ordered sound populations.
 */
export interface IAutoMovieProductionSoundPlan {
  /** Sound-plan schema. */
  version: 1;

  /** Exact builder input shared with the film timeline. */
  inputFingerprint: string;

  /** Production frame rate. */
  fps: number;

  /**
   * Exact frame rate when `fps` is fractional. Integer legacy rates use an equivalent denominator of one when this field is omitted.
   */
  frameRate?: IAutoMovieProductionFrameRate;

  /** Exact finished-film frame count. */
  totalFrames: number;

  /** Fixed output PCM sample rate. */
  sampleRate: 48_000;

  /** Fixed interleaved stereo channel count. */
  channels: 2;

  /**
   * Selected direct-path propagation profile; omission preserves the byte-compatible legacy dry path.
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
