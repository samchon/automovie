import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Type contracts exchanged by AutoMovieHumanHeadTree; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHeadTree {
  /**
   * Result of AutoMovieHumanHeadTree.source. Evaluate an explicit metre
   * declaration for fixed-chart caliper bases and independent eye studies.
   * Production parts instead use leaf() and their actual source context,
   * preserving arbitrary source callbacks.
   */
  export type ISourceResult = {
    /**
     * Geometric part with its original axis and section laws; its declared
     * source frame and units apply.
     */
    part: IAutoMovieViewPart;
    /**
     * The same part expressed as the canonical construction view, with physical
     * lengths in metres.
     */
    view: IAutoMovieConstructionView;
  };
}
