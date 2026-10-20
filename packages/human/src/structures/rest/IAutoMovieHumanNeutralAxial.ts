import { IAutoMovieHumanNeutralChord } from "./IAutoMovieHumanNeutralChord";

/** Ordered axial chords in the declared mechanical chain. */
export interface IAutoMovieHumanNeutralAxial {
  /** Pelvis to lower spinal support. */
  pelvisToLower: IAutoMovieHumanNeutralChord;

  /** Lower to middle spinal support. */
  lowerToMiddle: IAutoMovieHumanNeutralChord;

  /** Middle to waist-region support. */
  middleToWaist: IAutoMovieHumanNeutralChord;

  /** Waist-region to lower thoracic support. */
  waistToThorax: IAutoMovieHumanNeutralChord;

  /** Lower to upper thoracic support. */
  thoraxToUpper: IAutoMovieHumanNeutralChord;

  /** Upper thoracic to neck support. */
  upperToNeck: IAutoMovieHumanNeutralChord;

  /** Neck to head support; not clinical neck length. */
  neckToHead: IAutoMovieHumanNeutralChord;
}
