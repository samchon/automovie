import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanToePart } from "./IAutoMovieHumanToePart";

/**
 * Type contracts exchanged by AutoMovieHumanFootToeSources; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanFootToeSources {
  /**
   * One generated toe attachment and its defining parallel-plane part, in
   * calibration mm. Root is a skin attachment proxy, and apex combines
   * different retained along/across observations; neither is a measured MTP or
   * 3D tip.
   */
  export interface ICandidate {
    /**
     * Generating axis centre on the retained metatarsal cascade, mm; not a
     * surface-contact point or measured MTP.
     */
    root: AutoMovieVector3Tuple;

    /** Generated distal proxy, not an independently observed 3D tip, mm. */
    apex: AutoMovieVector3Tuple;

    /**
     * The identical fixed foot-chart definition passed to the production toe
     * builder.
     */
    part: IAutoMovieHumanToePart.IInput;
  }
}
