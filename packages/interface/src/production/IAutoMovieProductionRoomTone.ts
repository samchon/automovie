/**
 * One room-tone bed: a continuous, seeded noise floor under a dialogue scene
 * that has no recording to supply one.
 *
 * Engine's `renderProductionSound` generates it on the ambience bus from the
 * counter-based noise stream of `seed`, shaped by a fixed bank of octave
 * band-pass filters so that its octave-band energy falls or rises by
 * `tiltDbPerOctave`, and scaled so that its RMS amplitude is `levelDbfs`. A bed
 * is one signal over its whole interval, so it continues across any cut inside
 * it. Two beds where one ends on the frame the other starts meet with an
 * equal-power crossfade centred on that boundary; any other bed edge fades in
 * or out inside its interval. The mixer refuses a bed outside the film, an
 * empty or reversed interval, beds that overlap, a non-finite level or tilt and
 * a seed that is not a safe integer, naming the bed.
 */
export interface IAutoMovieProductionRoomTone {
  /** Bed id, unique among the film's beds, for refusals. */
  id: string;

  /** Film-global inclusive start frame, a nonnegative safe integer. */
  startFrame: number;

  /**
   * Film-global exclusive end frame, after `startFrame` and no later than the
   * film's last frame.
   */
  endFrame: number;

  /**
   * RMS amplitude of the bed in dB relative to full scale, `20 log10(rms)`,
   * such as −50 for an RMS amplitude of 0.0032.
   */
  levelDbfs: number;

  /**
   * Slope of the bed's octave-band energy in dB per octave: 0 is pink noise,
   * +3.01 is white noise and a negative value darkens the floor.
   */
  tiltDbPerOctave: number;

  /** Seed of the bed's noise stream; the same seed gives the same samples. */
  seed: number;
}
