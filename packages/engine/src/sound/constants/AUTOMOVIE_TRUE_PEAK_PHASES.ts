/**
 * Polyphase coefficients of the 4× interpolator that estimates true peak, after
 * ITU-R BS.1770-5 Annex 2.
 *
 * Annex 2 estimates true peak by oversampling four times with a low-pass
 * interpolating filter and taking the largest absolute value. Phase `p` (1, 2
 * or 3) gives the value a quarter, half or three quarters of a sample after
 * sample `n` as `Σ_j x[n + j] × PHASES[p − 1][j + 11]` for `j` from −11 to 12;
 * phase 0 is the sample itself. Each coefficient is the sinc at the input
 * Nyquist frequency, `sinc(p/4 − j)`, under a Kaiser window of half-length 12
 * samples and `β = 0.1102 × (80 − 8.7)` for an 80 dB stopband (Oppenheim and
 * Schafer, Discrete-Time Signal Processing, 3rd ed., §7.6.1). Annex 2's own
 * 48-tap table is one example filter; this one has the same 12 taps per phase
 * on each side.
 */
export const AUTOMOVIE_TRUE_PEAK_PHASES: readonly Float64Array[] =
  ((): Float64Array[] => {
    const beta: number = 0.1102 * (80 - 8.7);
    const bessel: (x: number) => number = (x: number): number => {
      let sum: number = 1;
      let term: number = 1;
      for (let k: number = 1; term > sum * 1e-21; ++k) {
        term *= (x / (2 * k)) * (x / (2 * k));
        sum += term;
      }
      return sum;
    };
    const norm: number = bessel(beta);
    return [1, 2, 3].map((phase: number): Float64Array => {
      const taps: Float64Array = new Float64Array(24);
      for (let j: number = -11; j <= 12; ++j) {
        const t: number = phase / 4 - j;
        const ratio: number = t / 12;
        taps[j + 11] =
          ((Math.sin(Math.PI * t) / (Math.PI * t)) *
            bessel(beta * Math.sqrt(Math.max(0, 1 - ratio * ratio)))) /
          norm;
      }
      return taps;
    });
  })();
