import type { IAutoMovieHumanHeadCompiled } from "./IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadPrior } from "./IAutoMovieHumanHeadPrior";

/**
 * The placed head landmarks and compiled face priors consumed by nose
 * construction.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadNose in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHeadNose {
  /** What the nose reads. */
  export interface IInput {
    /** The landmark skeleton. */
    plan: IAutoMovieHumanHeadLayout;

    /** The prior's face constants. */
    face: IAutoMovieHumanHeadPrior.IFace;

    /** The prior's compiled profile and dorsum splines. */
    compiled: IAutoMovieHumanHeadCompiled;
  }
}
