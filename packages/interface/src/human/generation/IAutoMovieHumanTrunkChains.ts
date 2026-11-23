import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";

/**
 * Type contracts exchanged by AutoMovieHumanTrunkChains; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanTrunkChains {
  /** The chains' sampling: uniform phases of each ring and the phase rule. */
  export interface ISampling {
    /** Uniform phases of the chains' rings. */
    samples: number;

    /** Phase correspondence rule. */
    rule: IAutoMovieLoftChain["rule"];
  }

  /**
   * Result of AutoMovieHumanTrunkChains.build. The chains.
   *
   * @param solution The solved trunk.
   * @param sampling The chains' ring sampling.
   * @returns `trunk` and `upper`, bottom first.
   */
  export type BuildResult = [IAutoMovieLoftChain, IAutoMovieLoftChain];
}
