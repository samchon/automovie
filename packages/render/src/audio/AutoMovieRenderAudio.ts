import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDialogueSpeakerBinding,
  IAutoMovieMixFilmSound,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { admitAutoMovieFilmDialogue } from "./internal/admitAutoMovieFilmDialogue.js";
import { encodeAutoMovieWavPcm16 } from "./internal/encodeAutoMovieWavPcm16.js";
import { mixAutoMovieFilmSound } from "./internal/mixAutoMovieFilmSound.js";
import { planAutoMovieDialogueMouths } from "./internal/planAutoMovieDialogueMouths.js";

/** Render's film audio admission, planning and encoding operations. */
export class AutoMovieRenderAudio {
  private constructor() {}

  /**
   * Admit film dialogue receipts and place decoded lines on the film clock.
   * Reads use the supplied host, line ids must be unique, and speech may not
   * exceed the film duration. Every line is decoded at 48 kHz.
   *
   * @param props The film sound, clock, frame count and file reader.
   * @returns Admitted lines in list order, with speech spans and samples.
   */
  public static admitDialogue(
    props: Pick<
      IAutoMovieMixFilmSound.IProps,
      "sound" | "frameRate" | "totalFrames" | "read"
    >,
  ): Promise<IAutoMovieMixFilmSound.ILine[]> {
    return admitAutoMovieFilmDialogue(props);
  }

  /**
   * Encode equal-length normalized channels as deterministic stereo PCM16 WAVE.
   * Inputs must be nonempty, finite and within [-1, 1], and the sample rate
   * must be a positive safe integer.
   *
   * @param left Left channel.
   * @param right Right channel.
   * @param sampleRate Samples per second.
   * @returns Canonical 44-byte-header RIFF/WAVE bytes.
   */
  public static encodeWavPcm16(
    left: Float32Array,
    right: Float32Array,
    sampleRate: number,
  ): Uint8Array {
    return encodeAutoMovieWavPcm16(left, right, sampleRate);
  }

  /**
   * Mix the film sound list into its mastered 48 kHz stereo PCM16 soundtrack.
   * All source bytes are read through the supplied host; repeated cue or line
   * ids, missing files and invalid admission or sound plans are refused.
   *
   * @param props The sound list, film clock, reader and optional loudness.
   * @returns The WAVE bytes and digest, plan, analysis, loudness and lines.
   */
  public static mixFilmSound(
    props: IAutoMovieMixFilmSound.IProps,
  ): Promise<IAutoMovieMixFilmSound.IResult> {
    return mixAutoMovieFilmSound(props);
  }

  /**
   * Plan dialogue mouths from admitted lines and speaker-to-actor bindings.
   * Only lines bound to exactly one actor produce a mouth entry; each admitted
   * line carries its envelope jaw and, when present, phoneme-derived visemes.
   *
   * @param props The admitted lines, speaker bindings and admission frame rate.
   * @returns The film's dialogue mouth track.
   */
  public static planDialogueMouths(props: {
    lines: readonly IAutoMovieMixFilmSound.ILine[];
    speakers: readonly IAutoMovieDialogueSpeakerBinding[];
    frameRate: IAutoMovieProductionFrameRate;
  }): IAutoMovieDialogueMouthTrack {
    return planAutoMovieDialogueMouths(props);
  }
}
