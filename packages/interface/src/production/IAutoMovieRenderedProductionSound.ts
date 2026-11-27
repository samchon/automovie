import type { IAutoMovieProductionSoundAnalysis } from "./IAutoMovieProductionSoundAnalysis";
import type { IAutoMovieLoudnessIntent } from "./IAutoMovieLoudnessIntent";

/**
 * Fresh stereo samples of a production mix or its master, paired with analysis
 * of those exact samples.
 *
 * Engine's `renderProductionSound` returns the mix, with each dialogue line
 * levelled and no master stage, so its samples may leave [−1, 1]. Engine's
 * `masterProductionSound` returns the master of that mix, with
 * `loudness.master` present.
 */
export interface IAutoMovieRenderedProductionSound {
  /** Fixed 48 kHz stereo samples in LRLR order. */
  pcm: Float32Array;

  /** Analysis calculated from these exact samples. */
  analysis: IAutoMovieProductionSoundAnalysis;

  /** The loudness targets applied and the gains chosen to meet them. */
  loudness: IAutoMovieRenderedProductionSound.ILoudness;
}

/** Companion types of the rendered production sound. */
export namespace IAutoMovieRenderedProductionSound {
  /**
   * How the mix met its loudness targets, for the render report.
   *
   * The resulting integrated loudness and true peak are the analysis'
   * `integratedLoudness` and `truePeakDbtp`.
   */
  export interface ILoudness {
    /** The targets applied: the production's own, or the EBU R 128 defaults. */
    intent: IAutoMovieLoudnessIntent;

    /**
     * Whether the production declared `intent` or the mix fell back to EBU R
     * 128.
     */
    source: "declared" | "ebu-r128-default";

    /**
     * The level every dialogue line was brought to as placed, in LUFS: the
     * intent's `dialogueLufs`, else its `integratedLufs`.
     */
    dialogueLufs: number;

    /**
     * The true peak the master's limiter holds the master under, in dBTP: the
     * maximum true peak less the limiter's margin.
     */
    ceilingDbtp: number;

    /**
     * Each adopted line in plan order, with its loudness as placed before
     * levelling in LUFS and the gain applied in dB.
     */
    lines: {
      /** Line id. */
      id: string;

      /**
       * Integrated loudness of the faded line as a dual-mono pair, before its
       * gain.
       */
      measuredLufs: number;

      /** Gain applied to the line, within ±12 dB. */
      gainDb: number;
    }[];

    /** The master stage, present once `masterProductionSound` mastered the mix. */
    master?: IMaster;
  }

  /** What the master stage did to the mix. */
  export interface IMaster {
    /**
     * Integrated loudness of the mix before its static gain, in LUFS; null when
     * no block passes the absolute gate, and then no gain, limiting or check
     * applies.
     */
    mixLufs: number | null;

    /** The static gain applied to the mix, in dB. */
    gainDb: number;

    /**
     * The smallest gain the limiter applied to a frame, in dB; 0 when no peak
     * reached the ceiling.
     */
    limiterGainDb: number;
  }
}
