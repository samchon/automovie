/**
 * Default settings of the master's true-peak limiter, `limitAutoMovieTruePeak`.
 *
 * `ceilingMarginDb` places the limiter's ceiling below the production's maximum
 * true peak, because the delivery audit reads the decoded AAC and lossy
 * encoding can raise true peak above the value before encoding; 1 dB is the
 * margin #4053 sets. `lookAheadSeconds` is the attack: the gain falls along a
 * straight ramp over 5 ms (240 samples at 48 kHz) before each peak, so the gain
 * change concentrates its spectrum below about 200 Hz, the reciprocal of the
 * ramp, instead of a click. `releaseSeconds` is the time constant of the
 * exponential return to unity gain; at 100 ms the gain moves slowly against the
 * period of the lowest speech and music fundamentals, so it does not distort
 * individual waveform cycles. Both lengths are design choices of this limiter,
 * not measured values.
 */
export const AUTOMOVIE_TRUE_PEAK_LIMITER: Readonly<{
  /** Decibels between the maximum true peak and the limiter's ceiling. */
  ceilingMarginDb: number;

  /** Look-ahead and attack ramp length, in seconds. */
  lookAheadSeconds: number;

  /** Release time constant, in seconds. */
  releaseSeconds: number;
}> = Object.freeze({
  ceilingMarginDb: 1,
  lookAheadSeconds: 0.005,
  releaseSeconds: 0.1,
});
