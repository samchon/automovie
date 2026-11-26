/**
 * One hand's measures from the person's inputs, in the same millimetres as the
 * calibration, at the sites their definitions read (ANSUR II and ISO 7250-1):
 * the lengths and the breadth the hand's solve meets.
 */
export interface IAutoMovieHumanHandMeasures {
  /** Wrist to the tip of the middle finger, mm. */
  length: number;

  /** Wrist to the root of the middle finger, mm. */
  palm: number;

  /** Breadth across the palm over knuckles II to V, mm. */
  breadth: number;

  /** Length of the thumb from its metacarpophalangeal joint, mm. */
  thumb: number;
}
