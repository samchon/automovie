import type { IAutoMovieHumanHeadComposer } from "./IAutoMovieHumanHeadComposer";

/** Type contracts exchanged by AutoMovieHumanHeadOriginalSources; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadOriginalSources {
  /** Source requests before tree assembly or any regional raw loft.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Source requests before tree assembly or any regional raw loft.
   * @evidence contracts/development/design.md#principled-representation Source requests before tree assembly or any regional raw loft.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadOriginalSources.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadOriginalSources.create for source requests before tree assembly or any regional raw loft.
   */
  export interface IOutput {
    /** Empty is unrequested, unknown names throw before host work, tape-invariant names use the pre-closure host, exact top-level names select their closed-host factories, and absent/mixed/nested names retain the existing whole regional path. */
    request(names?: readonly string[]): IAutoMovieHumanHeadComposer.IDefinition;
  }
}
