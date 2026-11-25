import type { IAutoMovieHumanHeadComposer } from "./IAutoMovieHumanHeadComposer";

/**
 * Explicit scoped head-source requests before tree assembly or regional raw
 * lofting. Runtime construction and admission remain with
 * AutoMovieHumanHeadOriginalSources in Human.
 */
export namespace IAutoMovieHumanHeadOriginalSources {
  /** Source requests before tree assembly or any regional raw loft. */
  export interface IOutput {
    /**
     * Empty is unrequested, unknown names throw before host work,
     * tape-invariant names use the pre-closure host, exact top-level names
     * select their closed-host factories, and absent/mixed/nested names retain
     * the existing whole regional path.
     */
    request(names?: readonly string[]): IAutoMovieHumanHeadComposer.IDefinition;
  }
}
