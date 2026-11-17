import type { IAutoMovieHumanHeadCompiled } from "./IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadPrior } from "./IAutoMovieHumanHeadPrior";

/**
 * The placed head landmarks and compiled face priors consumed by nose construction.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadNose in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The placed head landmarks and compiled face priors consumed by nose construction. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IInput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IInput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanHeadNose exchanges the named IInput contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
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
