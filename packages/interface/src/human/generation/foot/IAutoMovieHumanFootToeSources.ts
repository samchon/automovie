import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanToePart } from "./IAutoMovieHumanToePart";

/** Type contracts exchanged by AutoMovieHumanFootToeSources; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootToeSources {
  /**
   * One generated toe attachment and its defining parallel-plane part, in calibration mm.
   * Root is a skin attachment proxy, and apex combines different retained
   * along/across observations; neither is a measured MTP or 3D tip.
   *
   * @evidence contracts/common.md#principled-implementation Keeps the actual generated attachment and distal proxy beside the parallel-plane source that consumes them.
   * @evidence contracts/common.md#clear-and-simple-design A point pair and its view input expose the skin source without inventing a skeletal landmark.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not label retained normalized placements or loop means as observed joint centres.
   * @evidence contracts/common.md#meaningful-documentation States calibration units, point provenance and the absence of anatomical joint identity.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A source record declares no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The owning define operation shares this record; the type coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous definition caller owns the points and walk.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One generated toe attachment and its defining parallel-plane part, in calibration mm.
   * @evidence contracts/development/design.md#principled-representation `root`: Generating axis centre on the retained metatarsal cascade, mm; not a surface-contact point or measured MTP. `apex`: Generated distal proxy, not an independently observed 3D tip, mm. `part`: The identical fixed foot-chart definition passed to the production toe builder.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootToeSources.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `root`, `apex`, `part`; callers supply the complete record.
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
