import type { IAutoMovieConstructionView } from "../../../construction/IAutoMovieConstructionView";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Type contracts exchanged by AutoMovieHumanHeadTree; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanHeadTree exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups ISourceResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanHeadTree; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the ISourceResult contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanHeadTree {
  /** Result of AutoMovieHumanHeadTree.source. Evaluate an explicit metre declaration for fixed-chart caliper bases
  and independent eye studies. Production parts instead use leaf() and
  their actual source context, preserving arbitrary source callbacks.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Evaluate an explicit metre declaration for fixed-chart caliper bases and independent eye studies.
 * @evidence contracts/development/design.md#principled-representation `part`: Geometric part with its original axis and section laws; its declared source frame and units apply. `view`: The same part expressed as the canonical construction view, with physical lengths in metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadTree.ISourceResult is the canonical exchange used by AutoMovieHumanHeadTree.source.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `part`, `view`; callers supply the complete record.
 */
  export type ISourceResult = {
    /** Geometric part with its original axis and section laws; its declared source frame and units apply. */
    part: IAutoMovieViewPart;
    /** The same part expressed as the canonical construction view, with physical lengths in metres. */
    view: IAutoMovieConstructionView;
  };
}
