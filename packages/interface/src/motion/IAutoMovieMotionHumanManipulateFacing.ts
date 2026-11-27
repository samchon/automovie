import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * Contracts used by manipulate.sequence.placed, manipulateFacing,
 * manipulateFacing.mine, manipulate.sequence.
 */
export namespace IAutoMovieMotionHumanManipulateFacing {
  /** A site a hand presses, as the rotation reads it. */
  export interface ISite {
    /** The site, world metres. */
    site: IAutoMovieVector3;

    /** Its outward normal, world. */
    normal: IAutoMovieVector3;

    /** The pressing hand. */
    side: AutoMovieHumanSide;
  }
}
