/**
 * The relaxed hand of the captured bind, a pose convention and no shape:
 * flexion in degrees toward the palm, index to little, one value per joint
 * (`AutoMovieHumanHandPosture.FINGERS` holds the numbers and their basis).
 */
export interface IAutoMovieHumanHandFingerPosture {
  /** The proximal phalanx from the hand's axis (wrist centre to knuckle III), degrees toward the palm. */
  proximal: readonly number[];

  /** The proximal phalanx's turn from that axis across the hand, degrees, positive toward the thumb's side. */
  spread: readonly number[];

  /** The middle phalanx from the proximal one, degrees toward the palm. */
  pip: readonly number[];

  /** The distal phalanx from the middle one, degrees toward the palm; negative is extension. */
  dip: readonly number[];
}
