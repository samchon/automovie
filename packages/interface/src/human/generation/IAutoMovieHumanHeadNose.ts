import type { IAutoMovieHumanHeadCompiled } from "./IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadPrior } from "./IAutoMovieHumanHeadPrior";

/** Type contracts exchanged by AutoMovieHumanHeadNose; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadNose {
  /** What the nose reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the nose reads.
   * @evidence contracts/development/design.md#principled-representation `plan`: The landmark skeleton. `face`: The prior's face constants. `compiled`: The prior's compiled profile and dorsum splines.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadNose.height.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `plan`, `face`, `compiled`; callers supply the complete record.
   */
  export interface IInput {
    /** The landmark skeleton. */
    plan: IAutoMovieHumanHeadLayout;

    /** The prior's face constants. */
    face: IAutoMovieHumanHeadPrior.IFace;

    /** The prior's compiled profile and dorsum splines. */
    compiled: IAutoMovieHumanHeadCompiled;
  }
}
