import type {
  IAutoMovieDialogueLipSync,
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawnMouth,
  IAutoMovieDialogueSpeakerBinding,
  IAutoMovieMixFilmSound,
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";

import { admitAutoMovieFilmDialogue } from "./internal/admitAutoMovieFilmDialogue.js";
import { encodeAutoMovieWavPcm16 } from "./internal/encodeAutoMovieWavPcm16.js";
import { mixAutoMovieFilmSound } from "./internal/mixAutoMovieFilmSound.js";
import { planAutoMovieDialogueMouths } from "./internal/planAutoMovieDialogueMouths.js";
import { measureAutoMovieDialogueLipSync } from "./internal/measureAutoMovieDialogueLipSync.js";

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
   * Supply finite samples in [-1, 1] and a positive integer rate whose stereo
   * byte rate of four times the sample rate fits a 32-bit RIFF field.
   *
   * @param left Left channel.
   * @param right Right channel.
   * @param sampleRate Samples per second.
   * @returns Canonical 44-byte-header RIFF/WAVE bytes.
   * @throws {Error} When channel lengths are empty, unequal or exceed the RIFF
   *   limit, the rate is nonpositive, or a sample magnitude exceeds one.
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

  /**
   * Measure each adopted line's lip-sync lag from the mouths read on drawn
   * frames, without reading pixels. Unbound lines report speaker-not-bound.
   * Lines without phoneme ranges report envelope-jaw; otherwise the viseme jaw
   * channel is compared with the line level over its speech span widened by
   * ceil(0.25 * fps). A read jaw without visemes reports envelope-jaw, and a
   * line with neither read reports mouth-not-drawn.
   *
   * @param props The adopted lines, handed mouth track, film plan and drawn
   *   frame mouths.
   * @returns One measurement entry per line in list order.
   */
  public static measureDialogueLipSync(
    props: AutoMovieRenderAudio.IMeasureDialogueLipSyncProps,
  ): IAutoMovieDialogueLipSync[] {
    return measureAutoMovieDialogueLipSync(props);
  }

}


/** Props for measuring the adopted dialogue's drawn lip-sync. */
export namespace AutoMovieRenderAudio {
  /** Inputs for measuring the drawn lip-sync of adopted dialogue. */
  export interface IMeasureDialogueLipSyncProps {
    /** The adopted lines with receipts and 48 kHz samples. */
    lines: readonly IAutoMovieMixFilmSound.ILine[];

    /** The mouth track handed to the subject. */
    track: IAutoMovieDialogueMouthTrack;

    /** The 48 kHz film clock and its frame count. */
    plan: Pick<
      IAutoMovieProductionSoundPlan,
      "fps" | "frameRate" | "sampleRate" | "totalFrames"
    >;

    /** Mouths read by the subject at each output frame, absent when none. */
    drawn: readonly (readonly IAutoMovieDrawnMouth[] | undefined)[];
  }
}
