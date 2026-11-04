/**
 * A boundary's jet along the height, as its owner states it: its value and its
 * first and second derivatives per millimetre of height. Two pieces that meet
 * at a landmark's height copy each other's jet there, so the span between
 * them is C2 to both owners (`AutoMovieHumanSeam.quintic`).
 */
export interface IAutoMovieHumanHeadJet {
  /** The boundary's value at the height, in the unit of the quantity it carries (millimetres of place or half width). */
  value: number;

  /** First derivative with height, the quantity's unit per millimetre. */
  slope: number;

  /** Second derivative with height, the quantity's unit per square millimetre. */
  curvature: number;
}
