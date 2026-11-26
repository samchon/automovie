import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Authoring inputs and results for inspecting a refrigerator.
 */
export namespace IAutoMovieMotionHumanDining {
  /** The parameters of `inspectRefrigerator`. */
  export interface IInspectRefrigerator {
    /** The fixed refrigerator prop's subject. */
    refrigerator: string;

    /** Shelf number from the bottom of the refrigerator compartment. */
    shelf: IAutoMovieMotionHumanDining.Shelf;

    /**
     * Additional opening in degrees within the door's remaining travel;
     * positive.
     */
    swing: number;

    /** The hand on the handle; the operate default (right) when absent. */
    hand?: AutoMovieHumanSide;
  }

  /** A refrigerator shelf, numbered from the bottom: shelf1 through shelf4. */
  export type Shelf = 1 | 2 | 3 | 4;
}
