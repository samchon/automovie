import type { IAutoMovieHumanToeSupplement } from "./IAutoMovieHumanToeSupplement";

/** Independent dimensions of all five toes. */
export interface IAutoMovieHumanToeSetSupplement {
  /** Hallux measurements in the foot chart. */
  hallux: IAutoMovieHumanToeSupplement;

  /** Second-toe measurements in the foot chart. */
  second: IAutoMovieHumanToeSupplement;

  /** Third-toe measurements in the foot chart. */
  third: IAutoMovieHumanToeSupplement;

  /** Fourth-toe measurements in the foot chart. */
  fourth: IAutoMovieHumanToeSupplement;

  /** Fifth-toe measurements in the foot chart. */
  fifth: IAutoMovieHumanToeSupplement;
}
