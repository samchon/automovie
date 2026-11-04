import { AutoMovieNaturalSpline } from "@automovie/engine";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";

/** The prior's curves prepared. */
export interface IAutoMovieHumanHeadCompiled {
  /** The prior they come from. */
  prior: AutoMovieHumanHeadPrior.IPrior;

  /** Nose's profile along the dorsum. */
  profile: AutoMovieNaturalSpline.ISpline;

  /** Nose's dorsum along the station. */
  dorsum: AutoMovieNaturalSpline.ISpline;
}
