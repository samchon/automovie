/**
 * One layer of an ear's free chain: a closed loop of the auricle's section at
 * one height, in the left frame.
 */
export interface IAutoMovieHumanHeadLoopLayer {
  /** Height of the layer, calibration millimetres. */
  y: number;

  /** The loop's points, `[x, z]`, running once round the section. */
  loop: P2[];
}

/** A point of a section. */
type P2 = [number, number];
