import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanToePart } from "./IAutoMovieHumanToePart";

/**
 * Type contracts exchanged by AutoMovieHumanFootToeSources; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanFootToeSources exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups ICandidate. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanFootToeSources; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the ICandidate contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanFootToeSources {
  /**
   * One generated toe attachment and its defining parallel-plane part, in calibration mm.
   * Root is a skin attachment proxy, and apex combines different retained
   * along/across observations; neither is a measured MTP or 3D tip.
   *
   * @evidence contracts/development/design.md#principled-representation Keeps the actual generated attachment and distal proxy beside the parallel-plane source that consumes them. `root`: Generating axis centre on the retained metatarsal cascade, mm; not a surface-contact point or measured MTP. `apex`: Generated distal proxy, not an independently observed 3D tip, mm. `part`: The identical fixed foot-chart definition passed to the production toe builder.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A point pair and its view input expose the skin source without inventing a skeletal landmark. Returned by AutoMovieHumanFootToeSources.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not label retained normalized placements or loop means as observed joint centres. Required fields are `root`, `apex`, `part`; callers supply the complete record.
   * @evidence contracts/development/common.md#meaningful-documentation States calibration units, point provenance and the absence of anatomical joint identity. One generated toe attachment and its defining parallel-plane part, in calibration mm.
   */
  export interface ICandidate {
    /** Generating axis centre on the retained metatarsal cascade, mm; not a surface-contact point or measured MTP. */
    root: AutoMovieVector3Tuple;

    /** Generated distal proxy, not an independently observed 3D tip, mm. */
    apex: AutoMovieVector3Tuple;

    /** The identical fixed foot-chart definition passed to the production toe builder. */
    part: IAutoMovieHumanToePart.IInput;
  }
}
