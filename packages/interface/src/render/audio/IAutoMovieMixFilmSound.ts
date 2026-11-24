import type { IAutoMovieProductionFrameRate } from "../../production/IAutoMovieProductionFrameRate.js";
import type { IAutoMovieProductionSoundAnalysis } from "../../production/IAutoMovieProductionSoundAnalysis.js";
import type { IAutoMovieProductionSoundPlan } from "../../production/IAutoMovieProductionSoundPlan.js";
import type { IAutoMovieProductionTtsReceipt } from "../../production/IAutoMovieProductionTtsReceipt.js";
import type { IAutoMovieFilmSound } from "../../production/sound/IAutoMovieFilmSound.js";
import type { IAutoMovieLoudnessIntent } from "../../production/sound/IAutoMovieLoudnessIntent.js";
import type { IAutoMovieRenderedProductionSound } from "../../production/sound/IAutoMovieRenderedProductionSound.js";

/**
 * Inputs and result of mixing a film's sound list into its delivered
 * soundtrack.
 */
export namespace IAutoMovieMixFilmSound {
  /**
   * A film's sound list, its clock, and the host that reads the files the list
   * names.
   *
   * Render's `mixAutoMovieFilmSound` reads every line's WAVE file and receipt
   * and every cue's asset through `read`, admits each receipt against its
   * bytes, decodes every file at 48 kHz, builds the sound plan on this clock
   * and mixes it with engine's `renderProductionSound`, levelling each line to
   * the dialogue target of `loudness`; engine's `masterProductionSound` then
   * brings the mix to the integrated target under the true-peak ceiling. It
   * refuses a line outside the levelling range, a master that misses the
   * tolerance, duplicate line or cue ids, a file `read` cannot supply, naming
   * its path, and every refusal of admission, decoding, planning and mixing.
   */
  export interface IProps {
    /** The film's sound list. */
    sound: IAutoMovieFilmSound;

    /** The film's exact frame rate. */
    frameRate: IAutoMovieProductionFrameRate;

    /** The film's whole frame count. */
    totalFrames: number;

    /** Read one production-relative file whole; reject when it cannot be read. */
    read: (path: string) => Promise<Uint8Array>;

    /** The production's loudness targets; absent, the mix uses EBU R 128. */
    loudness?: IAutoMovieLoudnessIntent | undefined;
  }

  /** The mixed soundtrack, the plan it was mixed from, and the adopted lines. */
  export interface IResult {
    /** 48 kHz stereo 16-bit PCM WAVE file of the master. */
    wav: Uint8Array;

    /** `sha256:` digest of `wav`. */
    sha256: string;

    /** The sound plan built from the list on the film clock. */
    plan: IAutoMovieProductionSoundPlan;

    /** Measurements of the master before 16-bit quantization. */
    analysis: IAutoMovieProductionSoundAnalysis;

    /** The targets the mix applied, each line's gain and the master stage. */
    loudness: IAutoMovieRenderedProductionSound.ILoudness;

    /**
     * Each adopted line in list order, with its admitted receipt and its
     * samples at 48 kHz.
     */
    lines: IAutoMovieMixFilmSound.ILine[];
  }

  /**
   * One adopted line as render's `admitAutoMovieFilmDialogue` admits and places
   * it, which the mix, the dialogue mouths and the lip-sync measure share.
   */
  export interface ILine {
    /** The line in the sound plan, over its speech span. */
    line: IAutoMovieProductionSoundPlan["dialogue"][number];

    /** The admitted receipt. */
    receipt: IAutoMovieProductionTtsReceipt;

    /** Mono samples at 48 kHz, as the mix received them. */
    samples: Float32Array;
  }
}
