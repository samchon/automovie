import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";

/** Type contracts exchanged by AutoMovieHumanTrunkChains; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkChains {
  /** The chains' sampling: uniform phases of each ring and the phase rule.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The chains' sampling: uniform phases of each ring and the phase rule.
   * @evidence contracts/development/design.md#principled-representation `samples`: Uniform phases of the chains' rings. `rule`: Phase correspondence rule.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanTrunkChains.build.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `samples`, `rule`; callers supply the complete record.
   */
  export interface ISampling {
    /** Uniform phases of the chains' rings. */
    samples: number;

    /** Phase correspondence rule. */
    rule: IAutoMovieLoftChain["rule"];
  }

  /** Result of AutoMovieHumanTrunkChains.build. The chains.
  @param solution The solved trunk.
  @param sampling The chains' ring sampling.
  @returns `trunk` and `upper`, bottom first.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The chains.
 * @evidence contracts/development/design.md#principled-representation The chains. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkChains.BuildResult is the canonical exchange used by AutoMovieHumanTrunkChains.build.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkChains.build for the chains.
 */
  export type BuildResult = [IAutoMovieLoftChain, IAutoMovieLoftChain];
}
