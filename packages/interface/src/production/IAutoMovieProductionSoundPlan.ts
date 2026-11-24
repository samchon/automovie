import type { IAutoMovieAcousticResponseProfile } from "./IAutoMovieAcousticResponseProfile";
import type { IAutoMovieProductionDialogueLine } from "./IAutoMovieProductionDialogueLine";
import type { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";
import type { IAutoMovieProductionRoomTone } from "./IAutoMovieProductionRoomTone";
import type { IAutoMovieProductionSoundCue } from "./IAutoMovieProductionSoundCue";
import type { IAutoMovieProductionSoundEvent } from "./IAutoMovieProductionSoundEvent";
import type { IAutoMovieSoundPropagationProfile } from "./IAutoMovieSoundPropagationProfile";

/**
 * Deterministic semantic sound input derived from one current compiled film
 * edit.
 */
export interface IAutoMovieProductionSoundPlan {
  /** Sound-plan schema. */
  version: 1;

  /** Exact builder input shared with the film timeline. */
  inputFingerprint: string;

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
   * Selected direct-path propagation profile; omission preserves the
   * byte-compatible legacy dry path.
   */
  propagationProfile?: IAutoMovieSoundPropagationProfile;

  /** Selected room-response source, or absent for the byte-compatible dry path. */
  acousticProfile?: IAutoMovieAcousticResponseProfile;

  /**
   * Optional attenuation of music cues around dialogue placements with adopted
   * PCM. Attack precedes each line and release follows it. Their absolute frame
   * anchors are rounded to sample ticks before interpolation. Overlaps use the
   * lowest gain. Only the part inside the film is applied. Omission preserves
   * the existing mix.
   */
  scoreDucking?:
    | {
        /** Finite linear music gain during dialogue, in [0, 1]. */
        gain: number;

        /** Nonnegative safe-integer film frames for the pre-dialogue ramp. */
        attackFrames: number;

        /** Nonnegative safe-integer film frames for the post-dialogue ramp. */
        releaseFrames: number;
      }
    | undefined;

  /** Ordered semantic sound occurrences. */
  events: IAutoMovieProductionSoundEvent[];

  /** Ordered authored audio cue placements across the destination buses. */
  cues: IAutoMovieProductionSoundCue[];

  /** Ordered dialogue/caption placements. */
  dialogue: IAutoMovieProductionDialogueLine[];

  /** Optional room-tone beds on the ambience bus; omission adds none. */
  roomTone?: IAutoMovieProductionRoomTone[];
}
