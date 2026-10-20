import { IAutoMovieHumanNeutralLevel } from "./IAutoMovieHumanNeutralLevel";

/** Horizontal geometric stations in the common model datum. */
export interface IAutoMovieHumanNeutralTrunk {
  /** Isolated upper thoracic envelope below the arm-connected branch. */
  upperThorax: IAutoMovieHumanNeutralLevel;

  /** Selected minimum-envelope site in the declared waist band. */
  waistBand: IAutoMovieHumanNeutralLevel;

  /** Selected maximum-envelope site in the declared pelvic band. */
  hipBand: IAutoMovieHumanNeutralLevel;
}
