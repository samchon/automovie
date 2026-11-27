/**
 * A streaming ITU-R BS.1770-5 meter of 48 kHz PCM: K-weighted gated integrated
 * loudness and 4× oversampled true peak.
 *
 * Engine's `createLoudnessMeter` makes one for mono or interleaved
 * stereo. Samples arrive in any number of `push` calls; `measure` reads the
 * result so far without disturbing it. The sound mix measures dialogue lines
 * and the master with it, and the delivery host measures the decoded delivered
 * audio with it.
 */
export interface IAutoMovieLoudnessMeter {
  /**
   * Add interleaved samples at the meter's channel count; a call may end
   * mid-frame and the next continues it.
   */
  push(samples: ArrayLike<number>): void;

  /** Measure everything pushed so far. */
  measure(): IAutoMovieLoudnessMeter.IMeasurement;
}

/** Companion types of the loudness meter. */
export namespace IAutoMovieLoudnessMeter {
  /** One meter reading. */
  export interface IMeasurement {
    /**
     * Gated integrated loudness in LUFS, or null when every block falls below
     * the absolute gate.
     */
    integratedLufs: number | null;

    /** True peak in dBTP, or null for digital silence. */
    truePeakDbtp: number | null;

    /** Whole sample frames measured. */
    sampleFrames: number;
  }
}
