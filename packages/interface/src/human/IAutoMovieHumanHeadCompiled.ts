import type { IAutoMovieNaturalCubicSpline } from "../construction/IAutoMovieNaturalCubicSpline";
import type { IAutoMovieHumanHeadPrior } from "./IAutoMovieHumanHeadPrior";

/** The prior's curves prepared. */
export interface IAutoMovieHumanHeadCompiled {
  /** The prior they come from. */
  prior: IAutoMovieHumanHeadPrior.IPrior;

  /** Nose's profile along the dorsum. */
  profile: IAutoMovieNaturalCubicSpline;

  /** Nose's dorsum along the station. */
  dorsum: IAutoMovieNaturalCubicSpline;
}
