/**
 * A production's loudness targets for its mixed and delivered soundtrack.
 *
 * Loudness is ITU-R BS.1770-5 gated integrated loudness in LUFS and true peak
 * is its Annex 2 estimate in dBTP, both as engine's
 * `createAutoMovieLoudnessMeter` measures them. Engine's
 * `renderProductionSound` levels each dialogue line to the dialogue target,
 * brings the master to `integratedLufs` and limits its true peak below
 * `maximumTruePeakDbtp`; the delivery audit checks the decoded delivered file
 * against the same values. A production that declares none is mixed and checked
 * against engine's `AUTOMOVIE_EBU_R128_LOUDNESS` (EBU R 128: −23 LUFS, 0.5 LU,
 * −1 dBTP). The mixer refuses non-finite values and a negative tolerance.
 */
export interface IAutoMovieLoudnessIntent {
  /**
   * Integrated loudness target of the whole soundtrack in LUFS, such as −23 for
   * EBU R 128 or −24 for ATSC A/85.
   */
  integratedLufs: number;

  /**
   * Largest accepted distance in LU between the measured integrated loudness
   * and `integratedLufs`; nonnegative.
   */
  toleranceLu: number;

  /** Largest accepted true peak of the soundtrack in dBTP. */
  maximumTruePeakDbtp: number;

  /**
   * Integrated loudness each dialogue line is levelled to as placed, in LUFS;
   * absent, lines are levelled to `integratedLufs`.
   */
  dialogueLufs?: number;
}
