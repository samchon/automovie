/**
 * Convert mono samples from one rate to another by band-limited interpolation
 * (Smith and Gossett, "A flexible sampling-rate conversion method", ICASSP
 * 1984).
 *
 * Output sample `i` sits at input position `t = i × from / to` and is the sum
 * of the input samples within `ZERO_CROSSINGS` zero crossings of a
 * windowed-sinc low-pass centred on `t`. The low-pass cuts at `ROLLOFF` of the
 * lower of the two Nyquist frequencies, so upsampling leaves no spectral images
 * and downsampling folds no content back below the new Nyquist frequency. The
 * kernel is read from one fixed table by linear interpolation between its
 * entries, so equal inputs give equal samples on every platform. Samples before
 * the first and after the last input sample are zero. The output holds
 * `round(source.length × to / from)` samples, which may be zero for a short
 * source and a low target rate.
 *
 * @param source Mono input samples at `from` samples per second; only read.
 * @param from Input rate, a positive safe integer.
 * @param to Output rate, a positive safe integer.
 * @returns New mono samples at `to` samples per second, rounded to Float32.
 */
export function resampleProductionAudio(
  source: Float32Array,
  from: number,
  to: number,
): Float32Array {
  const length: number = Math.round((source.length * to) / from);
  const output: Float32Array = new Float32Array(length);

  // The kernel's argument is in units of the low-pass's zero-crossing spacing.
  // Downsampling stretches that spacing over more input samples and scales the
  // kernel down by the same factor, so its DC gain stays one at either rate.
  const scale: number = Math.min(1, to / from) * ROLLOFF;
  const reach: number = Math.ceil(ZERO_CROSSINGS / scale);
  for (let index: number = 0; index < length; ++index) {
    const position: number = (index * from) / to;
    const centre: number = Math.floor(position);
    let sum: number = 0;
    for (
      let input: number = Math.max(0, centre - reach);
      input <= Math.min(source.length - 1, centre + reach);
      ++input
    ) {
      const distance: number = Math.abs(position - input) * scale;
      if (distance >= ZERO_CROSSINGS) continue;
      const at: number = distance * TABLE_DENSITY;
      const entry: number = Math.floor(at);
      const weight: number =
        KERNEL[entry]! + (at - entry) * (KERNEL[entry + 1]! - KERNEL[entry]!);
      sum += source[input]! * weight;
    }
    output[index] = sum * scale;
  }
  return output;
}

/**
 * Zero crossings of the sinc on each side of the centre. With `ROLLOFF` and the
 * Kaiser window below, the filter spans `2 × 32 / 0.9 ≈ 71` input samples when
 * upsampling, which gives a transition band of about 0.44 rad per input sample
 * by Kaiser's design formula `Δω = (A − 8) / (2.285 M)` (Oppenheim and Schafer,
 * Discrete-Time Signal Processing, 3rd ed., §7.6): 1.7 kHz at a 24 kHz source.
 */
const ZERO_CROSSINGS: number = 32;

/**
 * Cutoff as a fraction of the lower Nyquist frequency. At 0.9 the transition
 * band of a 24 kHz source runs from about 9.95 to 11.65 kHz, so speech up to 10
 * kHz passes and the first image of any passband tone lies in the stopband.
 */
const ROLLOFF: number = 0.9;

/** Kaiser window stopband attenuation in dB, the design target `A`. */
const STOPBAND_DB: number = 80;

/**
 * Kernel table entries per zero crossing; Smith and Gossett interpolate
 * linearly between them.
 */
const TABLE_DENSITY: number = 512;

/** Modified Bessel function of the first kind, order zero, by its power series. */
function besselI0(x: number): number {
  let sum: number = 1;
  let term: number = 1;
  for (let k: number = 1; term > sum * 1e-21; ++k) {
    term *= (x / (2 * k)) * (x / (2 * k));
    sum += term;
  }
  return sum;
}

/**
 * The windowed sinc `sinc(u) × I0(β √(1 − (u/Z)²)) / I0(β)` at `u = i /
 * TABLE_DENSITY`, for `u` from 0 to `ZERO_CROSSINGS`, followed by one zero so
 * the last interpolation step ends at the window's edge. `β = 0.1102 (A − 8.7)`
 * is Kaiser's shape for an attenuation `A` above 50 dB (Oppenheim and Schafer,
 * §7.6.1).
 */
const KERNEL: Float64Array = ((): Float64Array => {
  const beta: number = 0.1102 * (STOPBAND_DB - 8.7);
  const entries: number = ZERO_CROSSINGS * TABLE_DENSITY;
  const table: Float64Array = new Float64Array(entries + 2);
  const norm: number = besselI0(beta);
  for (let index: number = 0; index <= entries; ++index) {
    const u: number = index / TABLE_DENSITY;
    const sinc: number = u === 0 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u);
    const ratio: number = u / ZERO_CROSSINGS;
    table[index] =
      (sinc * besselI0(beta * Math.sqrt(Math.max(0, 1 - ratio * ratio)))) /
      norm;
  }
  return table;
})();
