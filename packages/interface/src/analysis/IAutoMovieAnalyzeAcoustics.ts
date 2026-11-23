import type { IAutoMovieAcousticRequest } from "./IAutoMovieAcousticRequest";

/** Data and callback contracts shared by the AnalyzeAcoustics operations. */
export namespace IAutoMovieAnalyzeAcoustics {
  /**
   * Solve one room for reverberation, equipment noise and partition
   * performance.
   *
   * Three closed forms, each stated so a reader can check the arithmetic:
   *
   * - The Sabine absorption `A = sum(S * alpha)` and `T60 = 0.161 * V / A`;
   * - The room constant `R = A / (1 - alpha_mean)`, and at each receiver `Lp = 10
   *   * log10(sum over sources of 10^(Lw/10) * (Q / (4*pi*r^2) + 4/R))`, the
   *   direct field plus the diffuse field;
   * - The composite transmission loss `R_c = -10 * log10(sum(tau * S) / sum(S))`
   *   with `tau = 10^(-R/10)`, which is why one weak panel dominates a strong
   *   wall.
   *
   * The exclusions are stated as loudly as the results. A single broadband
   * absorption coefficient cannot produce a speech transmission index, which
   * needs a modulation transfer function over an impulse response, so that
   * metric is `unsupported` rather than estimated.
   *
   * The reverberation time, the room constant and the receiver level are all
   * statements about a diffuse field, so all three gap wherever there is none:
   * a room that absorbs nothing rings forever, and a room that absorbs
   * everything never rings at all. Neither extreme is reported as a number. The
   * second is the one worth naming, because Sabine does not diverge there but
   * keeps returning `0.161 * V / A`, a positive decay time for an anechoic
   * chamber, which is the arithmetic of the model rather than a property of the
   * room.
   *
   * A receiver whose energy underflows to zero or overflows to infinity in
   * double precision has no level, so the level metrics gap with a reason
   * naming which bound was crossed.
   *
   * Throws on a malformed request (see {@link IAutoMovieAcousticRequest}), on a
   * receiver within `1e-12` m of a source, and when the sealed run would fail
   * validation; otherwise the run is always `solved`, with one sound-pressure
   * sample per receiver when a level exists.
   */
  export type IProps = {
    /** Study to solve; validated in full before any arithmetic. */
    request: IAutoMovieAcousticRequest;
  };
}
